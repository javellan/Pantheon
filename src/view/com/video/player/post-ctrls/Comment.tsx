import React from 'react'
import {Pressable, type StyleProp, type ViewStyle} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {Shadow} from '#/state/cache/types'
import {useRequireAuth} from '#/state/session'
// import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {MessageSolidIcon} from '#/components/tao-icons/MessageSolid'
import {formatCount} from '../../../util/numeric/format'
import {Text} from '../../../util/text/Text'

export function Comment({
  post,
  onPressReply,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  onPressReply: () => void
}): React.ReactNode {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const requireAuth = useRequireAuth()
  // const playHaptic = useHaptics()

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
          // playHaptic('Light')
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
      <MessageSolidIcon
        style={[defaultCtrlColor, {pointerEvents: 'none'}]}
        width={32}
        shadow={a.icon_shadow_dark.shadowColor}
      />
      {typeof post.replyCount !== 'undefined' ? (
        <Text
          style={[
            defaultCtrlColor,
            a.text_sm,
            a.font_bold,
            a.user_select_none,
            a.text_shadow_dark_sharp,
            {paddingHorizontal: 2},
          ]}>
          {formatCount(i18n, post.replyCount)}
        </Text>
      ) : undefined}
    </Pressable>
  )
}
