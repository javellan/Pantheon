import {useState} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useEventListener} from 'expo'
import {VideoPlayer, VideoView} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'

import {isAndroid} from '#/platform/detection'
import {atoms as a} from '#/alf'
import {isTallAspectRatio} from './utils'

export function VideoItemInner({
  player,
  embed,
}: {
  player: VideoPlayer
  embed: AppBskyEmbedVideo.View
}) {
  const {bottom} = useSafeAreaInsets()
  const [isReady, setIsReady] = useState(!isAndroid)

  useEventListener(player, 'timeUpdate', evt => {
    if (isAndroid && !isReady && evt.currentTime >= 0.05) {
      setIsReady(true)
    }
  })

  return (
    <VideoView
      accessible={false}
      style={[
        a.absolute,
        {
          top: 0,
          left: 0,
          right: 0,
          bottom: bottom,
        },
        !isReady && {opacity: 0},
      ]}
      player={player}
      nativeControls={false}
      contentFit={isTallAspectRatio(embed.aspectRatio) ? 'cover' : 'contain'}
      accessibilityIgnoresInvertColors
    />
  )
}
