import {AppBskyEmbedVideo} from '@atproto/api'
import {Image, ImageStyle} from 'expo-image'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a} from '#/alf'

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
      contentFit={blur ? 'cover' : 'contain'}
      blurRadius={blur ? 100 : 0}
    />
  ) : null
}
