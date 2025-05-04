import {Image, ImageStyle} from 'expo-image'
import {AppBskyEmbedVideo} from '@atproto/api'

import {atoms as a} from '#/alf'
import {fit} from './VideoItemInner'

export function VideoItemPlaceholder({
  embed,
  style,
  blur,
}: {
  embed: AppBskyEmbedVideo.View
  style?: ImageStyle
  blur?: boolean
}) {
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
              bottom: 0,
            },
        style,
      ]}
      contentFit={blur ? 'cover' : fit(embed)}
      blurRadius={blur ? 100 : 0}
    />
  ) : null
}
