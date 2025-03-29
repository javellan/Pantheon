import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {AppBskyFeedDefs, AppBskyFeedThreadgate, RichText} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'
import {nanoid} from 'nanoid/non-secure'

import * as apilib from '#/lib/api/index'
import {EmbeddingDisabledError} from '#/lib/api/resolve'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  fillThreadModerationCache,
  sortThread,
  ThreadModerationCache,
  ThreadPost,
  usePostThreadQuery,
} from '#/state/queries/post-thread'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {threadgateRecordToAllowUISetting} from '#/state/queries/threadgate'
import {useAgent, useSession} from '#/state/session'
import {ComposerOptsPostRef} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {whenAppViewReady} from '../../composer/Composer'
import {getShortenedLength, ThreadDraft} from '../../composer/state/composer'
import {createThreadSkeleton, isThreadPost} from '../../post-thread/PostThread'

const CommentContext = createContext<{
  isThreadError: boolean
  commentCount: number
  title: string
  creatorDid: string
  comments: ThreadPost[][]
  enableInput: boolean
  sortReplies: string
  replyTo: ComposerOptsPostRef | null
  isPublishing: boolean
  doPostReply: (postText: string) => Promise<void>
  onPostReply: (postUri: string | undefined) => void
  setSortReplies: (newValue: string) => void
  setReplyTo: (replyTo: ComposerOptsPostRef | null) => void
}>({
  // @ts-ignore
  isThreadError: null,
  // @ts-ignore
  commentCount: null,
  // @ts-ignore
  title: null,
  // @ts-ignore
  creatorDid: null,
  // @ts-ignore
  comments: null,
  // @ts-ignore
  enableInput: null,
  // @ts-ignore
  sortReplies: null,
  // @ts-ignore
  replyTo: null,
  // @ts-ignore
  isPublishing: null,
  // @ts-ignore
  doPostReply: null,
  // @ts-ignore
  onPostReply: null,
  // @ts-ignore
  setSortReplies: null,
  // @ts-ignore
  setReplyTo: null,
})

export function useComments() {
  const ctx = useContext(CommentContext)
  if (!ctx) {
    throw new Error('useComments must be used within a Context.Provider')
  }
  return ctx
}

export function CommentsProvider({
  uri,
  children,
}: {
  uri: string
  children: ReactNode
}) {
  const {_} = useLingui()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const {data: preferences} = usePreferencesQuery()
  const {
    isFetching,
    isError: isThreadError,
    // error: threadError,
    refetch,
    data: {thread, threadgate} = {},
    dataUpdatedAt: fetchedAt,
  } = usePostThreadQuery(uri)

  const serverPrefs = preferences?.threadViewPrefs
  const serverSortReplies = serverPrefs?.sort ?? 'hotness'
  const serverPrioritizeFollowedUsers =
    serverPrefs?.prioritizeFollowedUsers ?? true
  const prioritizeFollowedUsers = serverPrioritizeFollowedUsers
  const [sortReplies, setSortReplies] = useState(serverSortReplies)
  const threadgateRecord = threadgate?.record as
    | AppBskyFeedThreadgate.Record
    | undefined
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })

  const [justPostedUris, setJustPostedUris] = useState(() => new Set<string>())
  const [fetchedAtCache] = useState(() => new Map<string, number>())
  const [randomCache] = useState(() => new Map<string, number>())

  const commentCount = (thread as ThreadPost).post.replyCount ?? 0
  const title = isFetching
    ? 'Loading Comments...'
    : `${commentCount} Comment${commentCount !== 1 ? 's' : ''}`

  const currentDid = currentAccount?.did
  const threadModerationCache = useMemo(() => {
    const cache: ThreadModerationCache = new WeakMap()
    if (thread && moderationOpts) {
      fillThreadModerationCache(cache, thread, moderationOpts)
    }
    return cache
  }, [thread, moderationOpts])

  const skeleton = useMemo(() => {
    if (!thread) return null
    return createThreadSkeleton(
      sortThread(
        thread,
        {
          // Prefer local state as the source of truth.
          sort: sortReplies,
          prioritizeFollowedUsers,
        },
        threadModerationCache,
        currentDid,
        justPostedUris,
        threadgateHiddenReplies,
        fetchedAtCache,
        fetchedAt,
        randomCache,
      ),
      currentDid,
      false, // No tree view
      threadModerationCache,
      false, // No hidden replies state
      threadgateHiddenReplies,
    )
  }, [
    thread,
    prioritizeFollowedUsers,
    sortReplies,
    currentDid,
    threadModerationCache,
    justPostedUris,
    threadgateHiddenReplies,
    fetchedAtCache,
    fetchedAt,
    randomCache,
  ])

  let creatorDid = ''
  if (skeleton?.highlightedPost.type === 'post') {
    creatorDid = skeleton.highlightedPost.post.author.did
  }

  const comments = useMemo(() => {
    if (!skeleton) return []
    const postUri = skeleton.highlightedPost.uri
    return skeleton.replies
      .filter(r => isThreadPost(r))
      .reduce((acc, cur) => {
        if (cur.record.reply?.parent.uri === postUri) {
          acc.push([cur])
        } else {
          acc[acc.length - 1].push(cur)
        }
        return acc
      }, [] as ThreadPost[][])
  }, [skeleton])

  const enableInput =
    skeleton?.highlightedPost.type === 'post' &&
    !skeleton.highlightedPost.post.viewer?.replyDisabled

  const [replyTo, setReplyTo] = useState<ComposerOptsPostRef | null>(null)
  let postReplyTo: ComposerOptsPostRef | null = null
  if (skeleton?.highlightedPost.type === 'post') {
    const {uri, cid, author} = skeleton.highlightedPost.post
    postReplyTo = {uri, cid, author, text: ''}
  }
  const onPostReply = useCallback(
    (postUri: string | undefined) => {
      refetch()
      if (postUri) {
        setJustPostedUris(set => {
          const nextSet = new Set(set)
          nextSet.add(postUri)
          return nextSet
        })
      }
    },
    [refetch, setJustPostedUris],
  )
  const [isPublishing, setIsPublishing] = useState(false)
  const doPostReply = useCallback(
    async (postText: string) => {
      if (isPublishing) return
      if (!replyTo && !postReplyTo) return
      const richtext = new RichText({text: postText})
      await richtext.detectFacets(agent)
      const thread: ThreadDraft = {
        posts: [
          {
            id: nanoid(),
            richtext,
            shortenedGraphemeLength: getShortenedLength(richtext),
            labels: [],
            embed: {
              quote: undefined,
              media: undefined,
              link: undefined,
            },
          },
        ],
        postgate: createPostgateRecord({
          post: '',
          embeddingRules: undefined,
        }),
        threadgate: threadgateRecordToAllowUISetting({
          $type: 'app.bsky.feed.threadgate',
          post: '',
          createdAt: new Date().toString(),
          allow: undefined,
        }),
      }
      let postUri
      try {
        setIsPublishing(true)
        postUri = (
          await apilib.post(agent, queryClient, {
            thread,
            replyTo: replyTo?.uri || postReplyTo?.uri,
            onStateChange: console.log,
          })
        ).uris[0]
        try {
          await whenAppViewReady(agent, postUri, res => {
            const postedThread = res.data.thread
            return AppBskyFeedDefs.isThreadViewPost(postedThread)
          })
        } catch (waitErr: any) {
          logger.error(waitErr, {
            message: `Waiting for app view failed`,
          })
          // Keep going because the post *was* published.
        }
        onPostReply(postUri)
      } catch (e: any) {
        logger.error(e, {
          message: `Composer: create post failed`,
          hasImages: false,
        })
        let err = cleanError(e.message)
        if (err.includes('not locate record')) {
          err = _(
            msg`We're sorry! The post you are replying to has been deleted.`,
          )
        } else if (e instanceof EmbeddingDisabledError) {
          err = _(msg`This post's author has disabled quote posts.`)
        }
        // setError(err)
      } finally {
        setIsPublishing(false)
      }
    },
    [
      _,
      isPublishing,
      setIsPublishing,
      agent,
      queryClient,
      replyTo,
      postReplyTo,
      onPostReply,
    ],
  )

  const value = useMemo(
    () => ({
      isThreadError,
      commentCount,
      title,
      creatorDid,
      comments,
      enableInput,
      sortReplies,
      replyTo,
      isPublishing,
      doPostReply,
      onPostReply,
      setSortReplies,
      setReplyTo,
    }),
    [
      isThreadError,
      commentCount,
      title,
      creatorDid,
      comments,
      enableInput,
      sortReplies,
      replyTo,
      isPublishing,
      doPostReply,
      onPostReply,
      setSortReplies,
      setReplyTo,
    ],
  )

  return (
    <CommentContext.Provider value={value}>{children}</CommentContext.Provider>
  )
}
