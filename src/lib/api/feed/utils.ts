import {AtUri} from '@atproto/api'

import {BSKY_FEED_OWNER_DIDS} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {defaultInterests,Interest} from './interests'
import {defaultFeedPreferences, FeedPreferences} from './preferences'

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

export function aggregateFeedPreferences() {
  const storedFeedPreferences = (persisted.get(FEED_PREFERENCES) ||
    []) as FeedPreferences

  // Merge default preferences with user's stored preferences
  const mergedInterests = defaultInterests.map(interest => {
    const userInterest = storedFeedPreferences.interests.find(
      storedInterest => storedInterest.id === interest.id,
    )
    // Only selected preferences get stored, but selected is not a stored property
    return userInterest
      ? {...interest, value: userInterest.value, selected: true}
      : interest
  })
  const mergedFeedPreferences: FeedPreferences = {
    ...defaultFeedPreferences,
    ...storedFeedPreferences,
    interests: mergedInterests,
  }

  return mergedFeedPreferences
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
