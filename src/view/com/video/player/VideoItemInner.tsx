import {useState} from 'react'
import {useEventListener} from 'expo'
import {VideoPlayer, VideoView} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'

import {isAndroid} from '#/platform/detection'
import {atoms as a} from '#/alf'

export function VideoItemInner({
  player,
  embed,
}: {
  player: VideoPlayer
  embed: AppBskyEmbedVideo.View
}) {
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
          bottom: 0,
        },
        !isReady && {opacity: 0},
      ]}
      player={player}
      nativeControls={false}
      contentFit={fit(embed)}
      accessibilityIgnoresInvertColors
    />
  )
}

export function fit(embed: AppBskyEmbedVideo.View): 'cover' | 'contain' {
  const w = embed.aspectRatio?.width
  const h = embed.aspectRatio?.height
  return (w ?? 1) / (h ?? 1) <= 9 / 16 ? 'cover' : 'contain'
}
