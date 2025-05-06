import React, {useCallback} from 'react'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Shadow} from '#/state/cache/types'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {usePostRepostMutationQueue} from '#/state/queries/post'
import {useComposerControls} from '#/state/shell/composer'
import * as Toast from '../../../util/Toast'
import {RepostButton} from './RepostButton'

export function Repost({
  big,
  post,
  feedContext,
  onPostReply,
  logContext,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  feedContext?: string | undefined
  onPostReply?: (postUri: string | undefined) => void
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
}): React.ReactNode {
  const {_} = useLingui()
  const {openComposer} = useComposerControls()
  const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(
    post,
    logContext,
  )
  const {sendInteraction} = useFeedFeedbackContext()
  const isBlocked = Boolean(
    post.author.viewer?.blocking ||
      post.author.viewer?.blockedBy ||
      post.author.viewer?.blockingByList,
  )

  const onRepost = useCallback(async () => {
    if (isBlocked) {
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
      return
    }

    try {
      if (!post.viewer?.repost) {
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionRepost',
          feedContext,
        })
        await queueRepost()
      } else {
        await queueUnrepost()
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }, [
    _,
    post.uri,
    post.viewer?.repost,
    queueRepost,
    queueUnrepost,
    sendInteraction,
    feedContext,
    isBlocked,
  ])

  const onQuote = useCallback(() => {
    if (isBlocked) {
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
      return
    }

    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionQuote',
      feedContext,
    })
    openComposer({
      quote: post,
      onPost: onPostReply,
    })
  }, [
    _,
    sendInteraction,
    post,
    feedContext,
    openComposer,
    onPostReply,
    isBlocked,
  ])

  return (
    <RepostButton
      isReposted={!!post.viewer?.repost}
      repostCount={(post.repostCount ?? 0) + (post.quoteCount ?? 0)}
      onRepost={onRepost}
      onQuote={onQuote}
      big={big}
      embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
    />
  )
}
