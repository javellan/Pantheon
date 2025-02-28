import {ViewabilityConfig} from 'react-native'
import {createVideoPlayer, VideoPlayer} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'

import {platform} from '#/alf'

export function createThreeVideoPlayers(
  sources?: [string, string, string],
): [VideoPlayer, VideoPlayer, VideoPlayer] {
  // android is typically slower and can't keep up with a 0.1 interval
  const eventInterval = platform({
    ios: 0.2,
    android: 0.5,
    default: 0,
  })
  const p1 = createVideoPlayer(sources?.[0] ?? '')
  p1.loop = true
  p1.timeUpdateEventInterval = eventInterval
  const p2 = createVideoPlayer(sources?.[1] ?? '')
  p2.loop = true
  p2.timeUpdateEventInterval = eventInterval
  const p3 = createVideoPlayer(sources?.[2] ?? '')
  p3.loop = true
  p3.timeUpdateEventInterval = eventInterval
  return [p1, p2, p3]
}

export const viewabilityConfig = {
  itemVisiblePercentThreshold: 100,
  minimumViewTime: 0,
} satisfies ViewabilityConfig

export type CurrentSource = {
  source: string
} | null

/*
 * If the video is taller than 9:16
 */
export function isTallAspectRatio(
  aspectRatio: AppBskyEmbedVideo.View['aspectRatio'],
) {
  const videoAspectRatio =
    (aspectRatio?.width ?? 1) / (aspectRatio?.height ?? 1)
  return videoAspectRatio <= 9 / 16
}
