import {memo, useEffect} from 'react'
import {View} from 'react-native'
import {NativeGesture} from 'react-native-gesture-handler'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {VideoPlayer} from 'expo-video'
import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  ModerationDecision,
} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {POST_TOMBSTONE, usePostShadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {atoms as a, ios} from '#/alf'
import {Text} from '#/components/Typography'
import {Overlay} from './Overlay'
import {VideoItemInner} from './VideoItemInner'
import {VideoItemPlaceholder} from './VideoItemPlaceholder'

type VideoItem = {
  moderation: ModerationDecision
  post: AppBskyFeedDefs.PostView
  video: AppBskyEmbedVideo.View
  feedContext: string | undefined
}

let VideoItem = ({
  player,
  post,
  embed,
  active,
  adjacent,
  scrollGesture,
  isScrolling,
  moderation,
  feedContext,
}: {
  player?: VideoPlayer
  post: AppBskyFeedDefs.PostView
  embed: AppBskyEmbedVideo.View
  active: boolean
  adjacent: boolean
  scrollGesture: NativeGesture
  isScrolling: boolean
  moderation?: ModerationDecision
  feedContext: string | undefined
}): React.ReactNode => {
  const postShadow = usePostShadow(post)
  const {width, height} = useSafeAreaFrame()
  const {sendInteraction} = useFeedFeedbackContext()

  useEffect(() => {
    if (active) {
      sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionSeen',
        feedContext,
      })
    }
  }, [active, post.uri, feedContext, sendInteraction])

  // TODO: high-performance android phones should also
  // be capable of rendering 3 video players, but currently
  // we can't distinguish between them
  const shouldRenderVideo = active || ios(adjacent)

  return (
    <View style={[a.relative, {height, width}]}>
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
          <VideoItemPlaceholder embed={embed} />
          {shouldRenderVideo && player && (
            <VideoItemInner player={player} embed={embed} />
          )}
          {moderation && (
            <Overlay
              player={player}
              post={postShadow}
              embed={embed}
              active={active}
              scrollGesture={scrollGesture}
              isScrolling={isScrolling}
              moderation={moderation}
              feedContext={feedContext}
            />
          )}
        </>
      )}
    </View>
  )
}
VideoItem = memo(VideoItem)

export {VideoItem}
