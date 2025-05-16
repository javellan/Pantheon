import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ActivityIndicator, ListRenderItem, ViewToken} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {useSharedValue} from 'react-native-reanimated'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {VideoPlayer} from 'expo-video'
import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  ModerationDecision,
} from '@atproto/api'
import {useFocusEffect} from '@react-navigation/native'

import {useEnableKeyboardControllerScreen} from '#/lib/hooks/useEnableKeyboardController'
import {
  getFeedPreferences,
  getFeedPreferencesLastUpdated,
} from '#/lib/api/feed/utils'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {ScrollProvider} from '#/lib/ScrollContext'
import {cleanError} from '#/lib/strings/errors'
import {isNative} from '#/platform/detection'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {
  FeedDescriptor,
  FeedParams,
  FeedPostSlice,
  FeedPostSliceItem,
  usePostFeedQuery,
} from '#/state/queries/post-feed'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {ListFooter} from '#/components/Lists'
import {EndMessage} from './EndMessage'
import {
  createThreeVideoPlayers,
  CurrentSource,
  viewabilityConfig,
} from './utils'
import VideoItem from './VideoItem'

export type VideoData = {
  _reactKey: string
  moderation: ModerationDecision
  post: AppBskyFeedDefs.PostView
  video: AppBskyEmbedVideo.View
  feedContext: string | undefined
  reason: FeedPostSlice['reason']
}

export function ClearlightFeed({
  feed,
  feedParams,
  isPageFocused,
  isPageAdjacent,
}: {
  feed: FeedDescriptor
  feedParams: FeedParams
  isPageFocused: boolean
  isPageAdjacent: boolean
}) {
  const t = useTheme()
  const {hasSession} = useSession()
  const {height} = useSafeAreaFrame()
  const enabled = isPageFocused || (isNative && isPageAdjacent)
  const opts = useMemo(() => ({enabled}), [enabled])
  const feedFeedback = useFeedFeedback(feed, hasSession)
  const [currentIndex, setCurrentIndex] = useState(0)
  const lastFeedRefreshTime = useRef<number>(Date.now())

  useEnableKeyboardControllerScreen(true)

  const {
    data,
    isFetching,
    isRefetching,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = usePostFeedQuery(feed, feedParams, opts)

  const videos = useMemo(() => {
    return (
      data?.pages.flatMap(page => {
        const items: VideoData[] = []
        for (const slice of page.slices) {
          const feedPost = slice.items.find(
            item => item.uri === slice.feedPostUri,
          )
          if (feedPost && AppBskyEmbedVideo.isView(feedPost.post.embed)) {
            items.push({
              _reactKey: feedPost._reactKey,
              moderation: feedPost.moderation,
              post: feedPost.post,
              video: feedPost.post.embed,
              feedContext: slice.feedContext,
              reason: slice.reason,
            })
          }
        }
        return items
      }) ?? []
    )
  }, [data])

  const [currentSources, setCurrentSources] = useState<
    [CurrentSource, CurrentSource, CurrentSource]
  >([null, null, null])

  const [players, setPlayers] = useState<
    [VideoPlayer, VideoPlayer, VideoPlayer] | null
  >(null)

  const scrollGesture = useMemo(() => Gesture.Native(), [])

  const doRefresh = useCallback(() => {
    if (isPageFocused) {
      if (players) {
        players.forEach(p => p.pause())
      }
      const feedPrefs = getFeedPreferences()
      if (feedPrefs.lastUpdated > lastFeedRefreshTime.current) {
        lastFeedRefreshTime.current = feedPrefs.lastUpdated
      }
      refetch()
    }
  }, [refetch, players, isPageFocused])

  //If the user has updated their preferences, we need to refetch the feed
  useFocusEffect(
    useCallback(() => {
      const feedPrefsLastUpdated = getFeedPreferencesLastUpdated()
      if (feedPrefsLastUpdated > lastFeedRefreshTime.current) {
        lastFeedRefreshTime.current = feedPrefsLastUpdated
        doRefresh()
      }
    }, [doRefresh]),
  )

  const scrollValue = useSharedValue(false)
  const onBeginDrag = useCallback(() => {
    'worklet'
    scrollValue.set(true)
  }, [scrollValue])
  const onEndDrag = useCallback(() => {
    'worklet'
    scrollValue.set(false)
  }, [scrollValue])
  const renderItem: ListRenderItem<VideoData> = useCallback(
    ({item, index}) => (
      <VideoItem
        data={item}
        player={players?.[index % 3]}
        active={
          isPageFocused &&
          index === currentIndex &&
          currentSources[index % 3]?.source === item.video.playlist
        }
        adjacent={index === currentIndex - 1 || index === currentIndex + 1}
        scrollGesture={scrollGesture}
        scrollValue={scrollValue}
      />
    ),
    [
      players,
      currentIndex,
      isPageFocused,
      currentSources,
      scrollGesture,
      scrollValue,
    ],
  )

  // Play or pause videos when swapping out feeds
  useEffect(() => {
    if (players) {
      const currentPlayer = players[currentIndex % 3]
      if (isPageFocused && !currentPlayer.playing) {
        currentPlayer.play()
      }
      if (!isPageFocused && currentPlayer.playing) {
        currentPlayer.pause()
      }
    }
  }, [isPageFocused, players, currentIndex])

  const updateVideoState = useCallback(
    (index: number) => {
      if (!videos.length) return

      const prevSlice = videos.at(index - 1)
      const prevPost = prevSlice?.post
      const prevEmbed = prevPost?.embed
      const prevVideo =
        prevEmbed && AppBskyEmbedVideo.isView(prevEmbed)
          ? prevEmbed.playlist
          : null
      const currSlice = videos.at(index)
      const currPost = currSlice?.post
      const currEmbed = currPost?.embed
      const currVideo =
        currEmbed && AppBskyEmbedVideo.isView(currEmbed)
          ? currEmbed.playlist
          : null
      const currVideoModeration = currSlice?.moderation
      const nextSlice = videos.at(index + 1)
      const nextPost = nextSlice?.post
      const nextEmbed = nextPost?.embed
      const nextVideo =
        nextEmbed && AppBskyEmbedVideo.isView(nextEmbed)
          ? nextEmbed.playlist
          : null

      const prevPlayerCurrentSource = currentSources[(index + 2) % 3]
      const currPlayerCurrentSource = currentSources[index % 3]
      const nextPlayerCurrentSource = currentSources[(index + 1) % 3]

      if (!players) {
        const args = ['', '', ''] satisfies [string, string, string]
        if (prevVideo) args[(index + 2) % 3] = prevVideo
        if (currVideo) args[index % 3] = currVideo
        if (nextVideo) args[(index + 1) % 3] = nextVideo
        const [player1, player2, player3] = createThreeVideoPlayers(args)

        setPlayers([player1, player2, player3])

        if (currVideo && isPageFocused) {
          const currPlayer = [player1, player2, player3][index % 3]
          currPlayer.play()
        }
      } else {
        const [player1, player2, player3] = players

        const prevPlayer = [player1, player2, player3][(index + 2) % 3]
        const currPlayer = [player1, player2, player3][index % 3]
        const nextPlayer = [player1, player2, player3][(index + 1) % 3]

        if (prevVideo && prevVideo !== prevPlayerCurrentSource?.source) {
          prevPlayer.replace(prevVideo)
        }
        prevPlayer.pause()

        if (currVideo) {
          if (currVideo !== currPlayerCurrentSource?.source) {
            currPlayer.replace(currVideo)
          }
          if (
            currVideoModeration &&
            (currVideoModeration.ui('contentView').blur ||
              currVideoModeration.ui('contentMedia').blur)
          ) {
            currPlayer.pause()
          } else {
            currPlayer.play()
          }
        }

        if (nextVideo && nextVideo !== nextPlayerCurrentSource?.source) {
          nextPlayer.replace(nextVideo)
        }
        nextPlayer.pause()
      }

      const updatedSources: [CurrentSource, CurrentSource, CurrentSource] = [
        ...currentSources,
      ]
      if (prevVideo && prevVideo !== prevPlayerCurrentSource?.source) {
        updatedSources[(index + 2) % 3] = {
          source: prevVideo,
        }
      }
      if (currVideo && currVideo !== currPlayerCurrentSource?.source) {
        updatedSources[index % 3] = {
          source: currVideo,
        }
      }
      if (nextVideo && nextVideo !== nextPlayerCurrentSource?.source) {
        updatedSources[(index + 1) % 3] = {
          source: nextVideo,
        }
      }

      if (
        updatedSources[0]?.source !== currentSources[0]?.source ||
        updatedSources[1]?.source !== currentSources[1]?.source ||
        updatedSources[2]?.source !== currentSources[2]?.source
      ) {
        setCurrentSources(updatedSources)
      }
    },
    [videos, currentSources, players, isPageFocused],
  )

  const updateVideoStateInitially = useNonReactiveCallback(() => {
    updateVideoState(currentIndex)
  })

  useFocusEffect(
    useCallback(() => {
      if (!players) {
        // create players, set sources, start playing
        updateVideoStateInitially()
      }
      return () => {
        if (players) {
          // manually release players when offscreen
          players.forEach(p => p.release())
          setPlayers(null)
        }
      }
    }, [players, updateVideoStateInitially]),
  )

  const onViewableItemsChanged = useCallback(
    ({viewableItems}: {viewableItems: ViewToken[]; changed: ViewToken[]}) => {
      if (viewableItems[0] && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index
        setCurrentIndex(newIndex)
        updateVideoState(newIndex)
      }
    },
    [updateVideoState],
  )

  const renderEndMessage = useCallback(
    () => (isFetching ? <ActivityIndicator size={'large'} /> : <EndMessage />),
    [isFetching],
  )

  return (
    <FeedFeedbackProvider value={feedFeedback}>
      <ScrollProvider onBeginDrag={onBeginDrag} onEndDrag={onEndDrag}>
        <GestureDetector gesture={scrollGesture}>
          <List
            data={videos}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={6}
            pagingEnabled={true}
            disableIntervalMomentum
            style={[t.atoms.bg]}
            onRefresh={() => doRefresh()}
            refreshing={isPageFocused && isRefetching}
            ListFooterComponent={
              <ListFooter
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                error={cleanError(error)}
                onRetry={fetchNextPage}
                height={height}
                showEndMessage
                renderEndMessage={renderEndMessage}
                style={[a.justify_center, a.border_0]}
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
              }
            }}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        </GestureDetector>
      </ScrollProvider>
    </FeedFeedbackProvider>
  )
}

function keyExtractor(item: FeedPostSliceItem) {
  return item._reactKey
}