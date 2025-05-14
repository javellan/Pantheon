import {useCallback, useEffect, useReducer, useRef, useState} from 'react'
import {Pressable} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Shadow} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {Link} from '#/components/Link'
import {AuthorFollowIcon} from '#/components/tao-icons/AuthorFollow'
import {AuthorFollowingIcon} from '#/components/tao-icons/AuthorFollowing'

export function Author({post}: {post: Shadow<AppBskyFeedDefs.PostView>}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const handle = sanitizeHandle(post.author.handle, '@')
  const profile = useProfileShadow(post.author)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ImmersiveVideo',
  )
  const [canToggleFollow, setCanToggleFollow] = useState(false)

  const [profileChanges, emitProfileChange] = useReducer(
    (state: (string | undefined)[], newVal: string | undefined) => {
      return [newVal, state[0]]
    },
    [post.author.viewer?.following],
  )
  useEffect(() => {
    emitProfileChange(profile.viewer?.following)
  }, [profile, emitProfileChange])

  const v1 = useSharedValue(0)
  const v2 = useSharedValue(0)
  const followStyle = useAnimatedStyle(() => {
    return {
      opacity: v1.value,
      transform: [{scale: v1.value}],
    }
  })
  const followingStyle = useAnimatedStyle(() => {
    return {
      opacity: v2.value,
      transform: [{scale: v2.value}],
    }
  })

  const disappearRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (profileChanges.length === 1 && !profileChanges[0]) {
      // First Render
      v1.value = 1
      setCanToggleFollow(true)
    } else if (profileChanges.length === 2) {
      const [after, before] = profileChanges
      if (after && !before) {
        // Follow
        v1.value = withTiming(0, {duration: 150})
        v2.value = withDelay(150, withTiming(1, {duration: 150}))
        disappearRef.current = setTimeout(() => {
          v2.value = withTiming(0, {duration: 150})
          setCanToggleFollow(false)
        }, 300 + 3000) // 3s after animation completes
      } else if (!after && before) {
        // Unfollow
        if (disappearRef.current) {
          clearTimeout(disappearRef.current)
        }
        v2.value = withTiming(0, {duration: 150})
        v1.value = withDelay(150, withTiming(1, {duration: 150}))
      }
    }
  }, [profileChanges, v1, v2, setCanToggleFollow])

  const doFollowOrUnfollow = useCallback(async () => {
    if (profile.viewer?.following) {
      await queueUnfollow()
      Toast.show(
        _(
          msg`No longer following ${sanitizeDisplayName(
            profile.displayName || profile.handle,
          )}`,
        ),
      )
    } else {
      await queueFollow()
      Toast.show(
        _(
          msg`Following ${sanitizeDisplayName(
            profile.displayName || profile.handle,
          )}`,
        ),
      )
    }
  }, [profile, queueFollow, queueUnfollow, _])

  return (
    <Link
      label={_(
        msg`View ${sanitizeDisplayName(
          post.author.displayName || post.author.handle,
        )}'s profile`,
      )}
      to={{
        screen: 'Profile',
        params: {name: post.author.did},
      }}
      style={[a.flex_row, a.gap_md, a.align_center]}>
      <UserAvatar type="user" avatar={post.author.avatar} size={48} />
      {post.author.did !== currentAccount?.did && (
        <Pressable
          pointerEvents={canToggleFollow ? 'auto' : 'none'}
          accessibilityLabel={
            profile.viewer?.following
              ? _(msg`Following ${handle}`)
              : _(msg`Follow ${handle}`)
          }
          accessibilityHint={
            profile.viewer?.following ? _(msg`Unfollow user`) : ''
          }
          style={[
            a.absolute,
            {
              top: '100%',
              right: '50%',
              marginRight: -16,
              marginTop: -16,
              width: 32,
              height: 32,
            },
          ]}
          hitSlop={HITSLOP_10}
          onPress={() => doFollowOrUnfollow()}>
          <Animated.View style={[a.absolute, a.inset_0, followStyle]}>
            <AuthorFollowIcon
              size="2xl"
              shadow={a.icon_shadow_dark.shadowColor}
            />
          </Animated.View>
          <Animated.View style={[a.absolute, a.inset_0, followingStyle]}>
            <AuthorFollowingIcon
              size="2xl"
              shadow={a.icon_shadow_dark.shadowColor}
            />
          </Animated.View>

          {/* <Animated.View style={[]}>
              <Animated.View style={[]}>
                {profile.viewer?.following ? (
                ) : (
                  <AuthorFollowIcon
                    size="2xl"
                    shadow={a.icon_shadow_dark.shadowColor}
                  />
                )}
              </Animated.View>
            </Animated.View> */}
        </Pressable>
      )}
    </Link>
  )
}
