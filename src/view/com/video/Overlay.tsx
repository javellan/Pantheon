import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
import {LinearGradient} from 'expo-linear-gradient'
import {VideoPlayer} from 'expo-video'
import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'

import {useHaptics} from '#/lib/haptics'
import {NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Shadow} from '#/state/cache/post-shadow'
import {FeedPostSlice} from '#/state/queries/post-feed'
import {useShellLayout} from '#/state/shell/shell-layout'
// import {useComposerControls} from '#/state/shell'
import {atoms as a, useTheme} from '#/alf'
import * as Hider from '#/components/moderation/Hider'
import {PlayIcon} from '#/components/tao-icons/Play'
import {RepostIcon} from '#/components/tao-icons/Repost'
import {Text} from '#/components/Typography'
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
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const seekingAnimationSV = useSharedValue(0)
  const insets = useSafeAreaInsets()
  const {width: screenWidth} = useSafeAreaFrame()
  const {headerHeight, footerHeight, postCtrlsWidth} = useShellLayout()
  const overlayTop = useMemo(() => {
    return headerHeight.get() + insets.top
  }, [headerHeight, insets])
  const playHaptic = useHaptics()

  const rkey = new AtUri(post.uri).rkey
  const record = AppBskyFeedPost.isRecord(post.record) ? post.record : undefined
  const richText = new RichTextAPI({
    text: record?.text || ('' as any),
    facets: record?.facets as any,
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
  const doSeek = useCallback(
    (isSeeking: boolean) => {
      ooval.set(isSeeking ? 0 : 1)
    },
    [ooval],
  )

  const x2opac = useSharedValue(0)
  const x2tnsf = useSharedValue(20)
  const x2style = useAnimatedStyle(() => {
    'worklet'
    return {
      opacity: withTiming(x2opac.get(), {duration: 200}),
      transform: [{translateY: withTiming(x2tnsf.get(), {duration: 200})}],
    }
  })
  const [isDoubleSpeed, setIsDoubleSpeed] = useState(false)
  useEffect(() => {
    x2opac.set(isDoubleSpeed ? 1 : 0)
    x2tnsf.set(isDoubleSpeed ? 0 : 20)
  }, [isDoubleSpeed, x2opac, x2tnsf])

  const longPressRef = useRef<boolean>(false)
  const speedUpPlayer = useCallback(() => {
    if (player) {
      playHaptic('Light')
      player.preservesPitch = true
      player.playbackRate = 2
      longPressRef.current = true
      setIsDoubleSpeed(true)
      ooval.set(0)
    }
  }, [player, ooval, setIsDoubleSpeed, playHaptic])
  const resetPlayerSpeed = useCallback(() => {
    if (player && longPressRef.current) {
      player.playbackRate = 1
      longPressRef.current = false
      setIsDoubleSpeed(false)
      ooval.set(1)
    }
  }, [player, ooval, setIsDoubleSpeed])

  const [lowerGradient, setLowerGradient] = useState<string>(
    a.bg_transparent.backgroundColor,
  )

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
                record={record! as any}
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

          <LinearGradient
            colors={[
              a.bg_transparent.backgroundColor,
              lowerGradient,
              lowerGradient,
            ]}
            style={[a.w_full, a.absolute, a.bottom_0, a.left_0, a.z_10]}>
            <Animated.View
              style={[
                {
                  paddingBottom: footerHeight.get() + 20,
                },
                // a.z_40,
                overlayOpacity,
              ]}>
              <View
                style={[
                  a.flex_1,
                  a.pl_md,
                  {
                    paddingRight: a.pr_md.paddingRight + postCtrlsWidth.get(),
                  },
                ]}>
                {isRepost && (
                  <View
                    style={[
                      a.hidden, // Hiding for now
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
                <Text
                  style={[a.text_lg, a.font_heavy, a.text_shadow_dark]}
                  emoji
                  numberOfLines={1}>
                  {sanitizeDisplayName(
                    post.author.displayName || post.author.handle,
                  )}
                </Text>
                <ExpandableRichTextView
                  value={richText}
                  authorHandle={post.author.handle}
                  onChangeExpand={isExpanded => {
                    setLowerGradient(
                      isExpanded
                        ? t.atoms.bg.backgroundColor
                        : a.bg_transparent.backgroundColor,
                    )
                  }}
                />
              </View>
            </Animated.View>
          </LinearGradient>
          <Animated.View
            style={[
              a.absolute,
              {
                bottom: footerHeight.get() + 20,
              },
              a.right_0,
              a.z_30,
              overlayOpacity,
            ]}>
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
            onSeekChange={doSeek}
          />

          <Animated.View
            style={[
              a.absolute,
              a.left_0,
              a.right_0,
              {
                bottom: footerHeight.get(),
              },
              a.pb_md,
              a.justify_center,
              a.align_center,
              a.flex_row,
              x2style,
            ]}>
            <Text style={[a.text_md, a.mr_xs]}>Speed 2X</Text>
            <PlayIcon size="sm" fill={t.atoms.text.color} />
            <PlayIcon size="sm" fill={t.atoms.text.color} />
          </Animated.View>
        </View>
      </Hider.Content>
    </Hider.Outer>
  )
}
