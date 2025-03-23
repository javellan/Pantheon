import {AppBskyFeedDefs, AppBskyFeedGetTimeline, BskyAgent} from '@atproto/api'
import shuffle from 'lodash.shuffle'

import {bundleAsync} from '#/lib/async/bundle'
import {timeout} from '#/lib/async/timeout'
import {feedUriToHref} from '#/lib/strings/url-helpers'
import {getContentLanguages} from '#/state/preferences/languages'
import {FeedParams} from '#/state/queries/post-feed'
import {FeedTuner, FeedTunerFn} from '../feed-manip'
import {Interest} from './interests'
import {FeedAPI, FeedAPIResponse, ReasonFeedSource} from './types'
import {createBskyTopicsHeader, isBlueskyOwnedFeed} from './utils'

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
  customFeeds: MergeFlowSource_Custom[] = []
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
    this.customFeeds = this.userInterests
      .flatMap(interest => getFeedUrisForInterest(interest))
      .reduce((acc, cur) => {
        if (!acc.includes(cur)) {
          acc.push(cur)
        }
        return acc
      }, [] as string[])
      .map(feedUri => new MergeFlowSource_Custom({agent, feedUri, feedTuners}))
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
    this.customFeeds = []
    this.feedCursor = 0
    this.itemCursor = 0
    this.sampleCursor = 0
    this.customFeeds = this.userInterests
      .flatMap(interest => getFeedUrisForInterest(interest))
      .reduce((acc, cur) => {
        if (!acc.includes(cur)) {
          acc.push(cur)
        }
        return acc
      }, [] as string[])
      .map(
        feedUri =>
          new MergeFlowSource_Custom({
            agent: this.agent,
            feedUri,
            feedTuners: this.feedTuners,
          }),
      )
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
    if (!cursor) {
      this.reset()
    }

    // Load prefs-based, trending and following feeds
    const promises = []
    for (const feed of this.customFeeds) {
      if (feed.numReady < 5) {
        promises.push(feed.fetchNext(10))
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
      let slice = this.sampleItem()
      if (slice[0]) {
        posts.push(slice[0])
      } else {
        break
      }
    }

    return {
      cursor: String(this.itemCursor),
      feed: posts,
    }
  }

  sampleItem() {
    const availableRightNow =
      this.following.numReady +
      this.trendingFeed.numReady +
      this.customFeeds.reduce((acc, cur) => acc + cur.numReady, 0)
    if (availableRightNow < 1) {
      return []
    }
    while (true) {
      if (this.sampleBatch.length === 0) {
        this.sampleBatch = shuffle('pppppffftt'.split(''))
      }
      const nextSampleType = this.sampleBatch.shift() as string
      switch (nextSampleType) {
        case 'p':
          for (const cf of shuffle(this.customFeeds)) {
            if (cf.numReady > 0) {
              return cf.take(1)
            }
          }
          continue
        case 'f':
          if (this.following.numReady > 0) {
            return this.following.take(1)
          } else {
            continue
          }
        case 't':
        default:
          if (this.trendingFeed.numReady > 0) {
            return this.trendingFeed.take(1)
          } else {
            continue
          }
      }
    }
  }
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
