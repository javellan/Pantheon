import {useCallback, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {useEvent} from 'expo'
import {VideoPlayer} from 'expo-video'
import {AppBskyFeedDefs, AppBskyFeedPost, RichText} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useHaptics} from '#/lib/haptics'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Shadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {usePostLikeMutationQueue} from '#/state/queries/post'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import * as Menu from '#/components/Menu'
import {useMenuControl} from '#/components/Menu'
import {PostDropdownMenuItems} from '../util/forms/PostDropdownBtnMenuItems'

export function PlayPauseTapArea({
  player,
  post,
  feedContext,
  record,
  richText,
}: {
  player: VideoPlayer
  post: Shadow<AppBskyFeedDefs.PostView>
  feedContext: string | undefined
  record: AppBskyFeedPost.Record
  richText: RichText
}) {
  const {_} = useLingui()
  const doubleTapRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playHaptic = useHaptics()
  const [queueLike] = usePostLikeMutationQueue(post, 'ImmersiveVideo')
  const {sendInteraction} = useFeedFeedbackContext()
  const {isPlaying} = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  })
  const menuControl = useMenuControl()
  const [hasBeenOpen, setHasBeenOpen] = useState(false)
  const lazyMenuControl = useMemo(
    () => ({
      ...menuControl,
      open() {
        setHasBeenOpen(true)
        // HACK. We need the state update to be flushed by the time
        // menuControl.open() fires but RN doesn't expose flushSync.
        setTimeout(menuControl.open)
      },
    }),
    [menuControl, setHasBeenOpen],
  )

  const togglePlayPause = () => {
    if (!player) return
    doubleTapRef.current = null
    if (player.playing) {
      player.pause()
    } else {
      player.play()
    }
  }

  const onPress = () => {
    if (doubleTapRef.current) {
      clearTimeout(doubleTapRef.current)
      doubleTapRef.current = null
      playHaptic('Light')
      queueLike()
      sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionLike',
        feedContext,
      })
    } else {
      doubleTapRef.current = setTimeout(togglePlayPause, 200)
    }
  }

  const onLongPress = useCallback(() => {
    playHaptic('Light')
    lazyMenuControl.open()
  }, [lazyMenuControl, playHaptic])

  return (
    <>
      <Button
        disabled={!player}
        aria-valuetext={
          isPlaying ? _(msg`Video is playing`) : _(msg`Video is paused`)
        }
        label={_(
          `Video from ${sanitizeHandle(
            post.author.handle,
            '@',
          )}. Tap to play or pause the video`,
        )}
        accessibilityHint={_(msg`Double tap to like`)}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[a.absolute, a.inset_0, a.z_10]}>
        <View />
      </Button>
      <Menu.Root control={lazyMenuControl}>
        {hasBeenOpen && (
          // Lazily initialized. Once mounted, they stay mounted.
          <PostDropdownMenuItems
            testID="postDropdownBtn"
            post={post}
            postFeedContext={feedContext}
            record={record}
            richText={richText}
            timestamp={post.indexedAt}
          />
        )}
      </Menu.Root>
    </>
  )
}
