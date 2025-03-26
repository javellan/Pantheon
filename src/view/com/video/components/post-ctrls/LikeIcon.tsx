import {View} from 'react-native'
import Animated, {
  Keyframe,
  LayoutAnimationConfig,
  useReducedMotion,
} from 'react-native-reanimated'

import {atoms as a, useTheme} from '#/alf'
import {HeartSolidIcon} from '#/components/tao-icons/HeartSolid'
import {s} from '#/lib/styles'

const keyframe = new Keyframe({
  0: {
    transform: [{scale: 1}],
  },
  10: {
    transform: [{scale: 0.7}],
  },
  40: {
    transform: [{scale: 1.2}],
  },
  100: {
    transform: [{scale: 1}],
  },
})

const circle1Keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{scale: 0}],
  },
  10: {
    opacity: 0.4,
  },
  40: {
    transform: [{scale: 1.5}],
  },
  95: {
    opacity: 0.4,
  },
  100: {
    opacity: 0,
    transform: [{scale: 1.5}],
  },
})

const circle2Keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{scale: 0}],
  },
  10: {
    opacity: 1,
  },
  40: {
    transform: [{scale: 0}],
  },
  95: {
    opacity: 1,
  },
  100: {
    opacity: 0,
    transform: [{scale: 1.5}],
  },
})

export function AnimatedLikeIcon({
  isLiked,
  hasBeenToggled,
}: {
  isLiked: boolean
  hasBeenToggled: boolean
}) {
  const t = useTheme()
  const size = 32
  const shouldAnimate = !useReducedMotion() && hasBeenToggled

  return (
    <View>
      <LayoutAnimationConfig skipEntering>
        {isLiked ? (
          <Animated.View
            entering={shouldAnimate ? keyframe.duration(300) : undefined}>
            <HeartSolidIcon
              style={[s.likeColor]}
              width={size}
              shadow={a.icon_shadow_dark.shadowColor}
            />
          </Animated.View>
        ) : (
          <HeartSolidIcon
            style={[{color: t.palette.white}, {pointerEvents: 'none'}]}
            width={size}
            shadow={a.icon_shadow_dark.shadowColor}
          />
        )}
        {isLiked && shouldAnimate ? (
          <>
            <Animated.View
              entering={circle1Keyframe.duration(300)}
              style={{
                position: 'absolute',
                backgroundColor: s.likeColor.color,
                top: 0,
                left: 0,
                width: size,
                height: size,
                zIndex: -1,
                pointerEvents: 'none',
                borderRadius: size / 2,
              }}
            />
            <Animated.View
              entering={circle2Keyframe.duration(300)}
              style={{
                position: 'absolute',
                backgroundColor: t.atoms.bg.backgroundColor,
                top: 0,
                left: 0,
                width: size,
                height: size,
                zIndex: -1,
                pointerEvents: 'none',
                borderRadius: size / 2,
              }}
            />
          </>
        ) : null}
      </LayoutAnimationConfig>
    </View>
  )
}
