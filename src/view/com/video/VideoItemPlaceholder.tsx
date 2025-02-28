import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Image, ImageStyle} from 'expo-image'
import {AppBskyEmbedVideo} from '@atproto/api'

import {atoms as a} from '#/alf'
import {isTallAspectRatio} from './utils'

export function VideoItemPlaceholder({
  embed,
  style,
  blur,
}: {
  embed: AppBskyEmbedVideo.View
  style?: ImageStyle
  blur?: boolean
}) {
  const {bottom} = useSafeAreaInsets()
  const src = embed.thumbnail
  let contentFit = isTallAspectRatio(embed.aspectRatio)
    ? ('cover' as const)
    : ('contain' as const)
  if (blur) {
    contentFit = 'cover' as const
  }
  return src ? (
    <Image
      accessibilityIgnoresInvertColors
      source={{uri: src}}
      style={[
        a.absolute,
        blur
          ? a.inset_0
          : {
              top: 0,
              left: 0,
              right: 0,
              bottom: bottom,
            },
        style,
      ]}
      contentFit={contentFit}
      blurRadius={blur ? 100 : 0}
    />
  ) : null
}
