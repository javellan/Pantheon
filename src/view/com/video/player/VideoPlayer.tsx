import {memo} from 'react'
import {View} from 'react-native'
import {NativeGesture} from 'react-native-gesture-handler'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import {VideoPlayer} from 'expo-video'
import {Trans} from '@lingui/macro'

import {POST_TOMBSTONE, usePostShadow} from '#/state/cache/post-shadow'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {VideoData} from '../ClearlightFeed'
import {Overlay} from './Overlay'
import {VideoItemInner} from './VideoItemInner'
import {VideoItemPlaceholder} from './VideoItemPlaceholder'

export default memo(function VideoPlayer({
  data,
  player,
  active,
  shouldRender,
  scrollValue,
  multiplyer,
  duration,
  scrollGesture,
  onPressReply,
}: {
  data: VideoData
  player?: VideoPlayer
  active: boolean
  shouldRender: boolean
  scrollValue: SharedValue<boolean>
  multiplyer: SharedValue<number>
  duration: SharedValue<number>
  scrollGesture: NativeGesture
  onPressReply: () => void
}) {
  const postShadow = usePostShadow(data.post)
  const overlayStyle = useAnimatedStyle(() => {
    const opacityVal = scrollValue.get() ? 0.25 : multiplyer.get() === 1 ? 1 : 0
    return {
      opacity: withTiming(opacityVal, {
        duration: scrollValue.get() ? 100 : duration.get(),
      }),
      pointerEvents: multiplyer.get() === 1 ? 'auto' : 'none',
    }
  })
  return (
    <>
      {postShadow === POST_TOMBSTONE ? (
        <View
          style={[
            a.absolute,
            a.inset_0,
            a.z_20,
            a.align_center,
            a.justify_center,
            {backgroundColor: 'rgba(0, 0, 0, 0.8)'},
          ]}>
          <Text
            style={[
              a.text_2xl,
              a.font_heavy,
              a.text_center,
              a.leading_tight,
              a.mx_xl,
            ]}>
            <Trans>Post has been deleted</Trans>
          </Text>
        </View>
      ) : (
        <>
          <VideoItemPlaceholder embed={data.video} />
          {shouldRender && player && (
            <VideoItemInner player={player} embed={data.video} />
          )}
          {data.moderation && (
            <Animated.View style={[a.absolute, a.inset_0, overlayStyle]}>
              <Overlay
                player={player}
                post={postShadow}
                embed={data.video}
                reason={data.reason}
                active={active}
                scrollGesture={scrollGesture}
                moderation={data.moderation}
                feedContext={data.feedContext}
                onPressReply={onPressReply}
              />
            </Animated.View>
          )}
        </>
      )}
    </>
  )
})
