import {AppBskyFeedDefs, AppBskyFeedGetTimeline, BskyAgent} from '@atproto/api'
import shuffle from 'lodash.shuffle'

import {bundleAsync} from '#/lib/async/bundle'
import {timeout} from '#/lib/async/timeout'
import {feedUriToHref} from '#/lib/strings/url-helpers'
import {getContentLanguages} from '#/state/preferences/languages'
import {FeedParams} from '#/state/queries/post-feed'
import {FeedTuner, FeedTunerFn} from '../feed-manip'
import {Interest} from './interests'
import {defaultFeedPreferences, FeedPreferences} from './preferences'
import {FeedAPI, FeedAPIResponse, ReasonFeedSource} from './types'
import {
  createBskyTopicsHeader,
  getFeedPreferences,
  getFeedPreferencesLastUpdated,
  isBlueskyOwnedFeed,
} from './utils'

const REQUEST_WAIT_MS = 500 // 500ms
const POST_AGE_CUTOFF = 60e3 * 60 * 120 // 120 hours

const TRENDING_FEED_URI =
  'at://did:plc:qnz6zuzbborkfoh6kwsjwdxx/app.bsky.feed.generator/cls-videonsfw3'
const TRENDING_NONPOLITIC_FEED_URI =
  'at://did:plc:qnz6zuzbborkfoh6kwsjwdxx/app.bsky.feed.generator/cls-trendingnp'

function getFeedUrisForInterest(interest: Interest): string[] {
  return (interest?.uris ?? []).map(
    uri =>
      `at://did:plc:qnz6zuzbborkfoh6kwsjwdxx/app.bsky.feed.generator/${uri}`,
  )
}

export class MergeFlowApi implements FeedAPI {
  userInterests: Interest[]
  agent: BskyAgent
  params: FeedParams
  feedTuners: FeedTunerFn[]
  following: MergeFlowSource_Following
  interestFeeds: MergeFlowSource_Custom[] = []
  interestFeedLastUpdated: number = 0
  trendingFeed: MergeFlowSource_Custom
  feedCursor = 0
  itemCursor = 0
  sampleCursor = 0
  sampleBatch: string[] = []

  constructor({
    agent,
    feedParams,
    feedTuners,
    userInterests = [],
    killDoomscroll,
  }: {
    agent: BskyAgent
    feedParams: FeedParams
    feedTuners: FeedTunerFn[]
    userInterests?: Interest[]
    killDoomscroll?: boolean
  }) {
    this.agent = agent
    this.params = feedParams
    this.feedTuners = feedTuners
    this.userInterests = userInterests
    this.interestFeeds = this._createInterestFeeds(getFeedPreferences())

    this.following = new MergeFlowSource_Following({
      agent: this.agent,
      feedTuners: this.feedTuners,
    })
    this.trendingFeed = new MergeFlowSource_Custom({
      agent,
      feedTuners,
      feedUri: killDoomscroll
        ? TRENDING_NONPOLITIC_FEED_URI
        : TRENDING_FEED_URI,
    })
  }

  reset() {
    this.following = new MergeFlowSource_Following({
      agent: this.agent,
      feedTuners: this.feedTuners,
    })
    this.interestFeeds = []
    this.feedCursor = 0
    this.itemCursor = 0
    this.sampleCursor = 0
    this.interestFeeds = this._createInterestFeeds(getFeedPreferences())
  }
  _createInterestFeeds(feedPreferences: FeedPreferences) {
    this.interestFeedLastUpdated = feedPreferences.lastUpdated
    return feedPreferences.interests
      .flatMap(interest => {
        const uris = getFeedUrisForInterest(interest)
        return uris
      })
      .reduce((acc, cur) => {
        if (!acc.includes(cur)) {
          acc.push(cur)
        }
        return acc
      }, [] as string[])
      .map(feedUri => {
        return new MergeFlowSource_Custom({
          agent: this.agent,
          feedUri,
          feedTuners: this.feedTuners,
          userInterests: feedPreferences.interests,
        })
      })
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.agent.getTimeline({
      limit: 1,
    })
    return res.data.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const feedPreferencesLastUpdated = getFeedPreferencesLastUpdated()
    if (!cursor || feedPreferencesLastUpdated > this.interestFeedLastUpdated) {
      this.reset()
    }

    // Load prefs-based, trending and following feeds
    const promises: Promise<void>[] = []
    for (const interestFeed of this.interestFeeds) {
      if (interestFeed.numReady < 5) {
        promises.push(interestFeed.fetchNext(10))
      }
    }
    if (this.trendingFeed.numReady < limit) {
      promises.push(this.trendingFeed.fetchNext(50))
    }
    if (this.following.numReady < limit) {
      promises.push(this.following.fetchNext(60))
    }
    await Promise.all(promises)

    // assemble a response by sampling from feeds with content
    const posts: AppBskyFeedDefs.FeedViewPost[] = []
    while (posts.length < limit) {
      let sample = this.sampleItem()
      if (sample) {
        posts.push(sample)
      } else {
        break
      }
    }

    return {
      cursor: String(this.itemCursor),
      feed: posts,
    }
  }

  sampleItem(): AppBskyFeedDefs.FeedViewPost | null {
    // If there are no available feeds, we need to skip the while loop
    // below, otherwise the loop will be infinite and the client
    // process will be blocked indefinitely, preventing further attempts
    // to fetch from those feeds and correct the problem
    const feedPreferences = getFeedPreferences()
    const availableRightNow = feedPreferences.feedTypes.reduce(
      (acc, feedType) => {
        switch (feedType.id) {
          case 'trending':
            return acc + feedType.weight > 0 ? this.trendingFeed.numReady : 0
          case 'following':
            return acc + feedType.weight > 0 ? this.following.numReady : 0
          case 'interests':
            return acc + feedType.weight > 0
              ? this.interestFeeds.reduce((acc, cur) => acc + cur.numReady, 0)
              : 0
        }
        return acc
      },
      0,
    )
    if (availableRightNow < 1) {
      return null
    }
    const startTime = Date.now()
    while (true) {
      if (this.sampleBatch.length === 0) {
        this.sampleBatch = shuffle(createWeightedFeedTypes(feedPreferences))
      }
      // The time check is a circuit breaker.  After a certain amount
      // of time we have to assume there's nothing available from the
      // configuration the user has chosen and we should stop trying
      // to sample.  For now, this falls back to the trending feed,
      // because the user can have interest feeds that are empty, and
      // not be following anyone, but trending will always have content
      const samplingTimeExpired = Date.now() - startTime > 10000
      const nextSampleType = samplingTimeExpired
        ? 't'
        : (this.sampleBatch.shift() as string)
      switch (nextSampleType) {
        case 'i':
          // weighted is a list of indices in interestFeeds, where each index is
          // repeated according to the interest value of the feed. This means that
          // feeds with higher interest values are more likely to be sampled.
          const weighted = this.interestFeeds.flatMap<number>((feed, i) => {
            const interestWeights = feed.userInterests.map(interest => {
              return interest.value
            })
            if (interestWeights.length === 0) {
              return Array()
            }
            //If there are multiple interests associated with a feed then we
            //need to weight the feed by the one with the max interest value
            const maxWeight = Math.max(...interestWeights)
            return Array(Math.round(maxWeight)).fill(i)
          })
          const weightedAndShuffled = shuffle(weighted)
          if (weightedAndShuffled.length === 0) {
            return this.interestFeeds[0].take(1)[0]
          }
          for (const feedIndex of weightedAndShuffled) {
            const interestFeed = this.interestFeeds[feedIndex]
            if (interestFeed.numReady > 0) {
              return interestFeed.take(1)[0]
            }
          }
          continue
        case 'f':
          if (this.following.numReady > 0) {
            return this.following.take(1)[0]
          } else {
            continue
          }
        case 't':
        default:
          if (this.trendingFeed.numReady > 0) {
            return this.trendingFeed.take(1)[0]
          } else {
            continue
          }
      }
    }
  }
}

function createWeightedFeedTypes(feedPreferences: FeedPreferences): string[] {
  // Extract weights for 'i', 'f', and 't' from feedPreferences.feedTypes
  const defaults = defaultFeedPreferences.feedTypes.reduce((acc, feedType) => {
    const key = feedType.id.charAt(0)
    acc[key] = feedType.weight
    return acc
  }, {} as Record<string, number>)
  let weights = feedPreferences.feedTypes.reduce(
    (acc, feedType) => {
      const typeMap: Record<string, keyof typeof acc> = {
        trending: 't',
        following: 'f',
        interests: 'i',
      }

      const key = typeMap[feedType.id]
      if (!key) {
        throw new Error(`Unknown feed type: ${feedType.id}`)
      }

      acc[key] = feedType.weight
      return acc
    },
    {...defaults},
  )
  // If the user has turned town all their sliders, then
  // we wind up with division by 0, so go back to defaults.
  // This can only be checked after the reduce, since a zero
  // weight is valid, but all zeros is not.
  if (weights.i === 0 && weights.f === 0 && weights.t === 0) {
    weights = {...defaults}
  }
  const totalWeight = weights.i + weights.f + weights.t
  const fCount = Math.round((weights.f / totalWeight) * 10)
  const tCount = Math.round((weights.t / totalWeight) * 10)
  const iCount = 10 - fCount - tCount
  return [
    ...Array(iCount).fill('i'),
    ...Array(fCount).fill('f'),
    ...Array(tCount).fill('t'),
  ]
}

class MergeFlowSource {
  agent: BskyAgent
  feedTuners: FeedTunerFn[]
  sourceInfo: ReasonFeedSource | undefined
  cursor: string | undefined = undefined
  queue: AppBskyFeedDefs.FeedViewPost[] = []
  hasMore = true

  constructor({
    agent,
    feedTuners,
  }: {
    agent: BskyAgent
    feedTuners: FeedTunerFn[]
  }) {
    this.agent = agent
    this.feedTuners = feedTuners
  }

  get numReady() {
    return this.queue.length
  }

  get needsFetch() {
    return this.hasMore && this.queue.length === 0
  }

  take(n: number): AppBskyFeedDefs.FeedViewPost[] {
    return this.queue.splice(0, n)
  }

  async fetchNext(n: number) {
    await Promise.race([this._fetchNextInner(n), timeout(REQUEST_WAIT_MS)])
  }

  _fetchNextInner = bundleAsync(async (n: number) => {
    const res = await this._getFeed(this.cursor, n)
    if (res.success) {
      this.cursor = res.data.cursor
      if (res.data.feed.length) {
        this.queue = this.queue.concat(res.data.feed)
      } else {
        this.hasMore = false
      }
    } else {
      this.hasMore = false
    }
  })

  protected _getFeed(
    _cursor: string | undefined,
    _limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    throw new Error('Must be overridden')
  }
}

class MergeFlowSource_Following extends MergeFlowSource {
  tuner = new FeedTuner(this.feedTuners)

  async fetchNext(n: number) {
    return this._fetchNextInner(n)
  }

  protected async _getFeed(
    cursor: string | undefined,
    limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    const res = await this.agent.getTimeline({cursor, limit})
    // run the tuner pre-emptively to ensure better mixing
    const slices = this.tuner.tune(res.data.feed, {
      dryRun: false,
    })
    res.data.feed = slices.map(slice => slice._feedPost)
    return res
  }
}

class MergeFlowSource_Custom extends MergeFlowSource {
  agent: BskyAgent
  minDate: Date
  feedUri: string
  userInterests: Interest[] = []

  constructor({
    agent,
    feedUri,
    feedTuners,
    userInterests = [],
  }: {
    agent: BskyAgent
    feedUri: string
    feedTuners: FeedTunerFn[]
    userInterests?: Interest[]
  }) {
    super({
      agent,
      feedTuners,
    })
    this.agent = agent
    this.feedUri = feedUri
    this.userInterests = userInterests
    this.sourceInfo = {
      $type: 'reasonFeedSource',
      uri: feedUri,
      href: feedUriToHref(feedUri),
    }
    this.minDate = new Date(Date.now() - POST_AGE_CUTOFF)
  }

  protected async _getFeed(
    cursor: string | undefined,
    limit: number,
  ): Promise<AppBskyFeedGetTimeline.Response> {
    try {
      const contentLangs = getContentLanguages().join(',')
      const isBlueskyOwned = isBlueskyOwnedFeed(this.feedUri)
      const res = await this.agent.app.bsky.feed.getFeed(
        {
          cursor,
          limit,
          feed: this.feedUri,
        },
        {
          headers: {
            ...(isBlueskyOwned
              ? createBskyTopicsHeader(this.userInterests)
              : {}),
            'Accept-Language': contentLangs,
          },
        },
      )
      // NOTE
      // some custom feeds fail to enforce the pagination limit
      // so we manually truncate here
      // -prf
      if (limit && res.data.feed.length > limit) {
        res.data.feed = res.data.feed.slice(0, limit)
      }
      // filter out older posts
      res.data.feed = res.data.feed.filter(
        post => new Date(post.post.indexedAt) > this.minDate,
      )
      // attach source info
      for (const post of res.data.feed) {
        // @ts-ignore
        post.__source = this.sourceInfo
      }
      return res
    } catch {
      // dont bubble custom-feed errors
      return {success: false, headers: {}, data: {feed: []}}
    }
  }
}
