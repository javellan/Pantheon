import {AtUri} from '@atproto/api'

import {BSKY_FEED_OWNER_DIDS} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {defaultInterests, Interest} from './interests'
import {defaultFeedPreferences, FeedPreferences} from './preferences'
import {getTaoStorageKeyForDid} from '#/state/persisted'
import {useSession} from '#/state/session'

let debugTopics = ''
if (isWeb && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  debugTopics = params.get('debug_topics') ?? ''
}

export function createBskyTopicsHeader(userInterests: Interest[] = []) {
  return {
    'X-Bsky-Topics':
      debugTopics || userInterests.map(i => i.id).join(',') || '',
  }
}
export const FEED_PREFERENCES = 'feedPreferences'

export function getFeedPreferencesLastUpdated(did?: string) {
  const key = did ? getTaoStorageKeyForDid(did) : undefined
  if (!key) return 0
  return persisted.get(FEED_PREFERENCES, key)?.lastUpdated || 0
}

export function getFeedPreferences(did?: string): FeedPreferences {
  const key = did ? getTaoStorageKeyForDid(did) : undefined
  const storedFeedPreferences = (key ? persisted.get(FEED_PREFERENCES, key) : []) as FeedPreferences
  const hydratedInterests = storedFeedPreferences.interests?.map(
    (interest: Interest) => {
      return {
        ...defaultFeedPreferences.interests.find(
          (defaultInterest: Interest) => defaultInterest.id === interest.id,
        ),
        ...interest,
      }
    },
  ) || []
  return {
    ...defaultFeedPreferences,
    ...storedFeedPreferences,
    interests: hydratedInterests,
  }
}

export function mergedUserAndDefaultFeedPreferences(did?: string) {
  const key = did ? getTaoStorageKeyForDid(did) : undefined
  const storedFeedPreferences = (key ? persisted.get(FEED_PREFERENCES, key) : []) as FeedPreferences

  // Merge default preferences with user's stored preferences
  const mergedInterests = defaultInterests.map(interest => {
    const userInterest = storedFeedPreferences.interests?.find(
      storedInterest => storedInterest.id === interest.id,
    )
    // Only selected preferences get stored, but selected is not a stored property
    return userInterest
      ? {...interest, value: userInterest.value, selected: true}
      : interest
  })

  return {
    ...defaultFeedPreferences,
    ...storedFeedPreferences,
    interests: mergedInterests,
  }
}

export function aggregateUserInterests(
  preferences?: UsePreferencesQueryResponse,
) {
  return (
    preferences?.interests?.tags?.map(
      tag => defaultInterests.find(interest => interest.id == tag) as Interest,
    ) ?? []
  )
}

export function isBlueskyOwnedFeed(feedUri: string) {
  const uri = new AtUri(feedUri)
  return BSKY_FEED_OWNER_DIDS.includes(uri.host)
}
