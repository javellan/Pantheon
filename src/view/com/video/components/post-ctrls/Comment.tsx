import React from 'react'
import {Pressable, type StyleProp, type ViewStyle} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {Shadow} from '#/state/cache/types'
import {useRequireAuth} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Bubble_Stroke2_Corner2_Rounded as Bubble} from '#/components/icons/Bubble'
import {formatCount} from '../../../util/numeric/format'
import {Text} from '../../../util/text/Text'

export function Comment({
  big,
  post,
  onPressReply,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  onPressReply: () => void
}): React.ReactNode {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const requireAuth = useRequireAuth()
  const playHaptic = useHaptics()

  const defaultCtrlColor = React.useMemo(
    () => ({
      color: t.palette.white,
    }),
    [t],
  ) as StyleProp<ViewStyle>

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
      testID="replyBtn"
      style={btnStyle}
      onPress={() => {
        if (!post.viewer?.replyDisabled) {
          playHaptic('Light')
          requireAuth(() => onPressReply())
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={_(
        msg`Reply (${plural(post.replyCount || 0, {
          one: '# reply',
          other: '# replies',
        })})`,
      )}
      accessibilityHint=""
      hitSlop={POST_CTRL_HITSLOP}>
      <Bubble style={[defaultCtrlColor, {pointerEvents: 'none'}]} width={36} />
      {typeof post.replyCount !== 'undefined' ? (
        <Text
          style={[
            defaultCtrlColor,
            big ? a.text_md : {fontSize: 15},
            a.user_select_none,
          ]}>
          {formatCount(i18n, post.replyCount)}
        </Text>
      ) : undefined}
    </Pressable>
  )
}
