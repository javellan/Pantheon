import {AtUri} from '@atproto/api'

import {BSKY_FEED_OWNER_DIDS} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
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

export function aggregateUserInterests(
  preferences?: UsePreferencesQueryResponse,
) {
  return (
    preferences?.interests?.tags?.map(
      tag => Interests.find(interest => interest.id == tag) as Interest,
    ) ?? []
  )
}

export function isBlueskyOwnedFeed(feedUri: string) {
  const uri = new AtUri(feedUri)
  return BSKY_FEED_OWNER_DIDS.includes(uri.host)
}
