import React from 'react'
import {Pressable} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {Shadow} from '#/state/cache/types'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {usePostLikeMutationQueue} from '#/state/queries/post'
import {useRequireAuth} from '#/state/session'
import {
  ProgressGuideAction,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import {atoms as a} from '#/alf'
import * as Toast from '../../../util/Toast'
import {CountWheel} from './CountWheel'
import {AnimatedLikeIcon} from './LikeIcon'

export function Like({
  big,
  post,
  feedContext,
  logContext,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  feedContext?: string | undefined
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
}) {
  const {_} = useLingui()
  const [queueLike, queueUnlike] = usePostLikeMutationQueue(post, logContext)
  const requireAuth = useRequireAuth()
  const {sendInteraction} = useFeedFeedbackContext()
  const {captureAction} = useProgressGuideControls()
  const playHaptic = useHaptics()
  const isBlocked = Boolean(
    post.author.viewer?.blocking ||
      post.author.viewer?.blockedBy ||
      post.author.viewer?.blockingByList,
  )

  const [hasLikeIconBeenToggled, setHasLikeIconBeenToggled] =
    React.useState(false)
  const onPressToggleLike = React.useCallback(async () => {
    if (isBlocked) {
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
      return
    }

    try {
      setHasLikeIconBeenToggled(true)
      if (!post.viewer?.like) {
        playHaptic('Light')
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionLike',
          feedContext,
        })
        captureAction(ProgressGuideAction.Like)
        await queueLike()
      } else {
        await queueUnlike()
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }, [
    _,
    playHaptic,
    post.uri,
    post.viewer?.like,
    queueLike,
    queueUnlike,
    sendInteraction,
    captureAction,
    feedContext,
    isBlocked,
  ])

  const btnStyle = React.useCallback(
    () => [
      a.gap_xs,
      a.justify_center,
      a.align_center,
      a.overflow_hidden,
      {padding: 5},
    ],
    [],
  )

  return (
    <Pressable
      testID="likeBtn"
      style={btnStyle}
      onPress={() => requireAuth(() => onPressToggleLike())}
      accessibilityRole="button"
      accessibilityLabel={
        post.viewer?.like
          ? _(
              msg`Unlike (${plural(post.likeCount || 0, {
                one: '# like',
                other: '# likes',
              })})`,
            )
          : _(
              msg`Like (${plural(post.likeCount || 0, {
                one: '# like',
                other: '# likes',
              })})`,
            )
      }
      accessibilityHint=""
      hitSlop={POST_CTRL_HITSLOP}>
      <AnimatedLikeIcon
        isLiked={Boolean(post.viewer?.like)}
        hasBeenToggled={hasLikeIconBeenToggled}
      />
      <CountWheel
        likeCount={post.likeCount ?? 0}
        big={big}
        isLiked={Boolean(post.viewer?.like)}
        hasBeenToggled={hasLikeIconBeenToggled}
      />
    </Pressable>
  )
}
