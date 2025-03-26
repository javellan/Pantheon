import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {GestureResponderEvent, View} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {useEvent} from 'expo'
import {VideoPlayer} from 'expo-video'
import {AppBskyFeedDefs, AppBskyFeedPost, RichText} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useHaptics} from '#/lib/haptics'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Shadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {usePostLikeMutationQueue} from '#/state/queries/post'
import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Menu from '#/components/Menu'
import {useMenuControl} from '#/components/Menu'
import {DoubleTapLikeHeartIcon} from '#/components/tao-icons/DoubleTapLikeHeart'
import {PlayIcon} from '#/components/tao-icons/Play'
import {PostDropdownMenuItems} from '../util/forms/PostDropdownBtnMenuItems'

function AnimatedHeart({x, y}: {x: number; y: number}) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.5)
  const rotation = useSharedValue(Math.floor(Math.random() * 81) - 40)

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, {duration: 200}),
      withDelay(200, withTiming(0, {duration: 400})),
    )

    scale.value = withSequence(
      withTiming(1.2, {duration: 200}),
      withTiming(1, {duration: 150}),
      withDelay(50, withTiming(0.8, {duration: 400})),
    )
  }, [opacity, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {translateX: x - 32}, // feckinhuge is 64
        {translateY: y - 32}, // feckinhuge is 64
        {scale: scale.value},
        {rotate: `${rotation.value}deg`},
      ],
    }
  })
  return (
    <Animated.View
      style={[
        animatedStyle,
        a.absolute,
        a.justify_center,
        a.align_center,
        {
          width: 64,
          height: 64,
        },
      ]}>
      <DoubleTapLikeHeartIcon size="feckinhuge" />
    </Animated.View>
  )
}

export function PlayPauseTapArea({
  player,
  post,
  feedContext,
  record,
  richText,
}: {
  player: VideoPlayer
  post: Shadow<AppBskyFeedDefs.PostView>
  feedContext: string | undefined
  record: AppBskyFeedPost.Record
  richText: RichText
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {footerHeight} = useShellLayout()
  const doubleTapRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playHaptic = useHaptics()
  const [queueLike] = usePostLikeMutationQueue(post, 'ImmersiveVideo')
  const {sendInteraction} = useFeedFeedbackContext()
  const {isPlaying} = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  })
  const menuControl = useMenuControl()
  const [hasBeenOpen, setHasBeenOpen] = useState(false)
  const lazyMenuControl = useMemo(
    () => ({
      ...menuControl,
      open() {
        setHasBeenOpen(true)
        // HACK. We need the state update to be flushed by the time
        // menuControl.open() fires but RN doesn't expose flushSync.
        setTimeout(menuControl.open)
      },
    }),
    [menuControl, setHasBeenOpen],
  )

  const playButtonOpacity = useSharedValue(0)
  const playButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(playButtonOpacity.get(), {duration: 200}),
    }
  })

  const togglePlayPause = () => {
    if (!player) return
    doubleTapRef.current = null
    if (player.playing) {
      playButtonOpacity.set(0.6)
      player.pause()
    } else {
      playButtonOpacity.set(0)
      player.play()
    }
  }

  useEffect(() => {
    if (isPlaying && playButtonOpacity.get() !== 0) {
      playButtonOpacity.set(0)
    }
  }, [playButtonOpacity, isPlaying])

  const [heartAnimations, setHeartAnimations] = useState<any[]>([])
  const onPress = (e: GestureResponderEvent) => {
    if (doubleTapRef.current) {
      clearTimeout(doubleTapRef.current)
      doubleTapRef.current = null
      playHaptic('Light')

      // Do stuff here...
      const {locationX, locationY} = e.nativeEvent
      const id = Date.now().toString()
      setHeartAnimations(prev => [...prev, {id, x: locationX, y: locationY}])
      setTimeout(() => {
        setHeartAnimations(prev => prev.filter(item => item.id !== id))
      }, 1000)

      queueLike()
      sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionLike',
        feedContext,
      })
    } else {
      doubleTapRef.current = setTimeout(togglePlayPause, 200)
    }
  }

  const onLongPress = useCallback(() => {
    playHaptic('Light')
    lazyMenuControl.open()
  }, [lazyMenuControl, playHaptic])

  return (
    <>
      <Button
        disabled={!player}
        aria-valuetext={
          isPlaying ? _(msg`Video is playing`) : _(msg`Video is paused`)
        }
        label={_(
          `Video from ${sanitizeHandle(
            post.author.handle,
            '@',
          )}. Tap to play or pause the video`,
        )}
        accessibilityHint={_(msg`Double tap to like`)}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[a.absolute, a.inset_0, a.z_10]}>
        <View />
      </Button>

      {heartAnimations.map(h => (
        <AnimatedHeart key={h.id} x={h.x} y={h.y} />
      ))}

      <Animated.View
        style={[
          a.absolute,
          a.inset_0,
          a.z_10,
          a.justify_center,
          a.align_center,
          {
            bottom: -20 - footerHeight.get(),
            pointerEvents: 'none',
          },
          playButtonStyle,
        ]}>
        <PlayIcon
          size="feckinhuge"
          style={{
            color: t.palette.white,
          }}
          shadow={a.icon_shadow_dark.shadowColor}
        />
      </Animated.View>
      <Menu.Root control={lazyMenuControl}>
        {hasBeenOpen && (
          // Lazily initialized. Once mounted, they stay mounted.
          <PostDropdownMenuItems
            testID="postDropdownBtn"
            post={post}
            postFeedContext={feedContext}
            record={record}
            richText={richText}
            timestamp={post.indexedAt}
          />
        )}
      </Menu.Root>
    </>
  )
}
