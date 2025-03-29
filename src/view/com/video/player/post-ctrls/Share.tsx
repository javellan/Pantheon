import React, {useCallback} from 'react'
import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'
import {AppBskyFeedDefs, AtUri} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {Shadow} from '#/state/cache/types'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {ShareIcon} from '#/components/tao-icons/Share'

export function Share({
  big,
  post,
  feedContext,
  style,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  feedContext?: string | undefined
  style?: StyleProp<ViewStyle>
}): React.ReactNode {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const loggedOutWarningPromptControl = useDialogControl()
  const {sendInteraction} = useFeedFeedbackContext()

  const shouldShowLoggedOutWarning = React.useMemo(() => {
    return (
      post.author.did !== currentAccount?.did &&
      !!post.author.labels?.find(label => label.val === '!no-unauthenticated')
    )
  }, [currentAccount, post])

  const defaultCtrlColor = React.useMemo(
    () => ({
      color: t.palette.white,
    }),
    [t],
  ) as StyleProp<ViewStyle>

  const onShare = useCallback(() => {
    const urip = new AtUri(post.uri)
    const href = makeProfileLink(post.author, 'post', urip.rkey)
    const url = toShareUrl(href)
    shareUrl(url)
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionShare',
      feedContext,
    })
  }, [post.uri, post.author, sendInteraction, feedContext])

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
    <View style={[a.flex_row, a.justify_between, a.align_center, style]}>
      {big && (
        <>
          <View style={a.align_center}>
            <Pressable
              testID="shareBtn"
              style={btnStyle}
              onPress={() => {
                if (shouldShowLoggedOutWarning) {
                  loggedOutWarningPromptControl.open()
                } else {
                  onShare()
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Share`)}
              accessibilityHint=""
              hitSlop={POST_CTRL_HITSLOP}>
              <ShareIcon
                style={[defaultCtrlColor, {pointerEvents: 'none'}]}
                width={32}
                shadow={a.icon_shadow_dark.shadowColor}
              />
            </Pressable>
          </View>
          <Prompt.Basic
            control={loggedOutWarningPromptControl}
            title={_(msg`Note about sharing`)}
            description={_(
              msg`This post is only visible to logged-in users. It won't be visible to people who aren't logged in.`,
            )}
            onConfirm={onShare}
            confirmButtonCta={_(msg`Share anyway`)}
          />
        </>
      )}
    </View>
  )
}
