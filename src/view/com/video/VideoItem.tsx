import {memo, useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  Gesture,
  GestureDetector,
  NativeGesture,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {VideoPlayer as IVideoPlayer} from 'expo-video'

import {useSetMinimalShellMode} from '#/state/shell'
import {atoms as a, ios, useTheme} from '#/alf'
import {VideoData} from './ClearlightFeed'
import Comments from './comments'
import VideoPlayer from './player/VideoPlayer'
import {useFullHeight} from './useFullHeight'

const SNAP_SCALE = 0.25
const ANIM_DURATION = 200

export default memo(function VideoItem({
  data,
  player,
  active,
  adjacent,
  scrollGesture,
  scrollValue,
}: {
  data: VideoData
  player?: IVideoPlayer
  active: boolean
  adjacent: boolean
  scrollGesture: NativeGesture
  scrollValue: SharedValue<boolean>
}) {
  const {width} = useSafeAreaFrame()
  const height = useFullHeight()
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const setMinimalShellMode = useSetMinimalShellMode()

  // Shared Animation Values
  const multiplyer = useSharedValue(1)
  const duration = useSharedValue(ANIM_DURATION)
  const currentDrawerTransY = useSharedValue<number | null>(null)

  // Open/Close the Comments
  const open = useCallback(() => {
    multiplyer.set(SNAP_SCALE)
    setMinimalShellMode(true)
    setIsOpen(true)
  }, [multiplyer, setMinimalShellMode, setIsOpen])
  const close = useCallback(() => {
    setMinimalShellMode(false)
    duration.set(ANIM_DURATION)
    multiplyer.set(1)
    setTimeout(() => setIsOpen(false), ANIM_DURATION)
  }, [multiplyer, duration, setMinimalShellMode, setIsOpen])

  // Reusable Drag Shelf Gesture
  const dragGesture = useMemo(() => {
    return Gesture.Pan()
      .blocksExternalGesture(scrollGesture)
      .onStart(() => {
        'worklet'
        duration.set(0)
        currentDrawerTransY.set(-height * (1 - multiplyer.get()) + insets.top)
      })
      .onUpdate(e => {
        'worklet'
        multiplyer.set(() => {
          const drawerTransYMoveTo = currentDrawerTransY.get()! + e.translationY
          return 1 - (drawerTransYMoveTo - insets.top) / -height
        })
      })
      .onEnd(() => {
        'worklet'
        duration.set(ANIM_DURATION)
        currentDrawerTransY.set(null)
        if (multiplyer.get() > 0.6) {
          runOnJS(close)()
        } else if (multiplyer.get() < 0.15) {
          multiplyer.set(0)
        } else {
          multiplyer.set(SNAP_SCALE)
        }
      })
  }, [
    scrollGesture,
    multiplyer,
    height,
    close,
    insets,
    currentDrawerTransY,
    duration,
  ])

  // Video Player Animated Styles
  const contentAreaStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(multiplyer.get() === 1 ? 0 : insets.top, {
            duration: duration.get(),
          }),
        },
        {
          scale: withTiming(multiplyer.get(), {
            duration: duration.get(),
          }),
        },
      ],
    }
  })
  const pressableAreaStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(multiplyer.get() === 1 ? 0 : insets.top, {
            duration: duration.get(),
          }),
        },
        {
          scaleY: withTiming(multiplyer.get(), {
            duration: duration.get(),
          }),
        },
      ],
      display: multiplyer.get() === 1 ? 'none' : 'flex',
    }
  })

  // Video Player Composed Gesture
  const videoPlayerGesture = useMemo(() => {
    if (isOpen) {
      return dragGesture
    }
    return Gesture.Native().simultaneousWithExternalGesture(scrollGesture)
  }, [isOpen, dragGesture, scrollGesture])

  // Comments Shelf Animated Style
  const shelfContainerStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(
        height * (1 - Math.min(SNAP_SCALE, multiplyer.get())) - insets.top,
        {duration: duration.get()},
      ),
      transform: [
        {
          translateY: withTiming(height * multiplyer.get() + insets.top, {
            duration: duration.get(),
          }),
        },
      ],
    }
  })

  return (
    <View
      style={[
        {width, height, flexGrow: 0, backgroundColor: 'black'},
        a.overflow_hidden,
        a.relative,
      ]}>
      <GestureDetector gesture={videoPlayerGesture}>
        <View style={[a.absolute, a.inset_0]}>
          <Animated.View
            style={[
              a.absolute,
              a.inset_0,
              a.z_10,
              {transformOrigin: 'top'},
              pressableAreaStyle,
            ]}>
            <TouchableWithoutFeedback
              accessibilityRole="button"
              style={[{width: '100%', height: '100%'}]}
              onPress={close}
            />
          </Animated.View>
          <Animated.View
            style={[
              a.absolute,
              a.inset_0,
              {transformOrigin: 'top'},
              contentAreaStyle,
            ]}>
            <VideoPlayer
              data={data}
              player={player}
              active={active}
              shouldRender={active || ios(adjacent)}
              scrollValue={scrollValue}
              multiplyer={multiplyer}
              duration={duration}
              scrollGesture={scrollGesture}
              onPressReply={open}
            />
          </Animated.View>
        </View>
      </GestureDetector>
      <Animated.View
        style={[
          a.absolute,
          t.atoms.bg,
          a.top_0,
          {width, transform: [{translateY: height}]},
          shelfContainerStyle,
        ]}>
        <Comments
          data={data}
          active={active && isOpen}
          dragGesture={dragGesture}
          scrollGesture={scrollGesture}
        />
      </Animated.View>
    </View>
  )
})
