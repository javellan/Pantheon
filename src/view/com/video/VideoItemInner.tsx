import {useState} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useEventListener} from 'expo'
import {VideoPlayer, VideoView} from 'expo-video'

import {isAndroid} from '#/platform/detection'
import {atoms as a} from '#/alf'

export function VideoItemInner({player}: {player: VideoPlayer}) {
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
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  )
}
