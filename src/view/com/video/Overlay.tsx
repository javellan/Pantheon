import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {clamp} from '#/lib/numbers'
import {NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {Shadow} from '#/state/cache/post-shadow'
import {useShellLayout} from '#/state/shell/shell-layout'
import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'
import {VideoPlayer} from 'expo-video'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {View} from 'react-native'
import {NativeGesture, Pressable} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
// import {useComposerControls} from '#/state/shell'
import {atoms as a} from '#/alf'
import * as Hider from '#/components/moderation/Hider'
import {Text} from '#/components/Typography'
import {useHaptics} from '#/lib/haptics'
import {sanitizeHandle} from '#/lib/strings/handles'
import {FeedPostSlice} from '#/state/queries/post-feed'
import {useLingui} from '@lingui/react'
import {PostCtrls} from './components/PostCtrls'
import {Scrubber} from './components/Scrubber'
import {ExpandableRichTextView} from './ExpandableRichTextView'
import {ModerationOverlay} from './ModerationOverlay'
import {PlayPauseTapArea} from './PlayPauseTapArea'

export function Overlay({
  player,
  post,
  embed,
  reason,
  active,
  scrollGesture,
  isScrolling,
  moderation,
  feedContext,
}: {
  player?: VideoPlayer
  post: Shadow<AppBskyFeedDefs.PostView>
  embed: AppBskyEmbedVideo.View
  reason: FeedPostSlice['reason']
  active: boolean
  scrollGesture: NativeGesture
  isScrolling: boolean
  moderation: ModerationDecision
  feedContext: string | undefined
}) {
  // const {openComposer} = useComposerControls()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const seekingAnimationSV = useSharedValue(0)
  const insets = useSafeAreaInsets()
  const {width: screenWidth} = useSafeAreaFrame()
  const {headerHeight} = useShellLayout()
  const overlayTop = useMemo(() => {
    return headerHeight.get() + insets.top
  }, [headerHeight, insets])
  const playHaptic = useHaptics()

  const rkey = new AtUri(post.uri).rkey
  const record = AppBskyFeedPost.isRecord(post.record) ? post.record : undefined
  const richText = new RichTextAPI({
    text: record?.text || '',
    facets: record?.facets,
  })

  const onPressShow = useCallback(() => {
    player?.play()
  }, [player])

  const mergedModui = useMemo(() => {
    const modui = moderation.ui('contentView')
    const mediaModui = moderation.ui('contentMedia')
    modui.alerts = [...modui.alerts, ...mediaModui.alerts]
    modui.blurs = [...modui.blurs, ...mediaModui.blurs]
    modui.filters = [...modui.filters, ...mediaModui.filters]
    modui.informs = [...modui.informs, ...mediaModui.informs]
    return modui
  }, [moderation])

  // const onPressReply = useCallback(() => {
  //   openComposer({
  //     replyTo: {
  //       uri: post.uri,
  //       cid: post.cid,
  //       text: record?.text || '',
  //       author: post.author,
  //       embed: post.embed,
  //     },
  //   })
  // }, [openComposer, post, record])

  const ooval = useSharedValue(1)
  const overlayOpacity = useAnimatedStyle(() => {
    'worklet'
    return {opacity: withTiming(ooval.get(), {duration: 200})}
  })
  useEffect(() => {
    ooval.set(isScrolling ? 0.4 : 1)
  }, [isScrolling, ooval])

  const longPressRef = useRef<boolean>(false)
  const speedUpPlayer = useCallback(() => {
    if (player) {
      playHaptic('Light')
      player.preservesPitch = true
      player.playbackRate = 2
      longPressRef.current = true
    }
  }, [player])
  const resetPlayerSpeed = useCallback(() => {
    if (player && longPressRef.current) {
      player.playbackRate = 1
      longPressRef.current = false
    }
  }, [player])

  const isRepost = AppBskyFeedDefs.isReasonRepost(reason)
  const repostBy = isRepost
    ? sanitizeDisplayName(
        reason.by.displayName || sanitizeHandle(reason.by.handle),
        moderation.ui('displayName'),
      )
    : undefined

  return (
    <Hider.Outer modui={mergedModui}>
      <Hider.Mask>
        <ModerationOverlay embed={embed} onPressShow={onPressShow} />
      </Hider.Mask>
      <Hider.Content>
        <View style={[a.absolute, a.inset_0, a.z_20]}>
          <View style={[a.flex_1]}>
            {player && (
              <PlayPauseTapArea
                player={player}
                post={post}
                feedContext={feedContext}
                record={record!}
                richText={richText}
              />
            )}
          </View>
          <View
            style={[
              a.absolute,
              {
                top: overlayTop + 10,
                left: 0,
                width: '25%',
                height: screenWidth * 0.25,
              },
              a.z_30,
            ]}>
            <Pressable
              accessibilityRole="button"
              style={[a.w_full, a.flex_1]}
              onLongPress={speedUpPlayer}
              onPressOut={resetPlayerSpeed}
            />
          </View>
          <View
            style={[
              a.absolute,
              {
                top: overlayTop,
                right: 0,
                width: '25%',
                height: screenWidth * 0.25,
              },
              a.z_30,
            ]}>
            <Pressable
              accessibilityRole="button"
              style={[a.w_full, a.flex_1]}
              onLongPress={speedUpPlayer}
              onPressOut={resetPlayerSpeed}
            />
          </View>

          <Animated.View
            pointerEvents="box-none"
            style={[
              a.absolute,
              {
                bottom: clamp(insets.bottom, 15, 60) + 48 + 20,
                left: 0,
                right: 0,
              },
              a.flex_row,
              a.align_end,
              a.z_40,
              overlayOpacity,
            ]}>
            <View style={[a.flex_1, a.px_md]}>
              {isRepost && (
                <View
                  style={[
                    a.py_xs,
                    a.px_sm,
                    a.mb_sm,
                    a.rounded_sm,
                    a.flex_row,
                    a.align_center,
                    {
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      alignSelf: 'flex-start',
                    },
                  ]}>
                  <RepostIcon style={[a.mr_sm]} width={13} height={13} />
                  <Text style={[a.text_sm]} emoji numberOfLines={1}>
                    {repostBy}
                  </Text>
                </View>
              )}
              <Text style={[a.text_md, a.font_heavy]} emoji numberOfLines={1}>
                {sanitizeDisplayName(
                  post.author.displayName || post.author.handle,
                )}
              </Text>
              <ExpandableRichTextView
                value={richText}
                authorHandle={post.author.handle}
              />
            </View>
            <PostCtrls
              post={post}
              logContext="FeedItem"
              onPressReply={() =>
                navigation.navigate('PostThread', {
                  name: post.author.did,
                  rkey,
                })
              }
              big
            />
          </Animated.View>

          <Scrubber
            active={active}
            player={player}
            seekingAnimationSV={seekingAnimationSV}
            scrollGesture={scrollGesture}
          />
        </View>
      </Hider.Content>
    </Hider.Outer>
  )
}
