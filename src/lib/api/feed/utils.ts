import {AtUri} from '@atproto/api'

import {BSKY_FEED_OWNER_DIDS} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {Interest, Interests} from './interests'

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
export const INTERESTS = 'interests'
export function aggregateUserInterests(
  preferences?: UsePreferencesQueryResponse,
) {
  const storedInterests = (persisted.get(INTERESTS) || []) as Interest[]

  // Merge master interests list with user's stored interest values to form initial state
  const mergedInterests = Interests.map(interest => {
    const userInterest = storedInterests.find(
      storedInterest => storedInterest.id === interest.id,
    )
    return userInterest ? {...interest, value: userInterest.value} : interest
  })

  return mergedInterests && mergedInterests.length > 0
    ? mergedInterests
    : preferences?.interests?.tags?.map(
        tag => Interests.find(interest => interest.id == tag) as Interest,
      ) ?? []
}

export function isBlueskyOwnedFeed(feedUri: string) {
  const uri = new AtUri(feedUri)
  return BSKY_FEED_OWNER_DIDS.includes(uri.host)
}
