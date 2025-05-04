import {memo, useCallback, useMemo, useState} from 'react'
import {Pressable, View} from 'react-native'
import {RichText as RichTextAPI} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {s} from '#/lib/styles'
import {POST_TOMBSTONE, usePostShadow} from '#/state/cache/post-shadow'
import {ThreadPost} from '#/state/queries/post-thread'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {RichText} from '#/components/RichText'
import {CaretDownIcon} from '#/components/tao-icons/CaretDown'
import {CaretRightIcon} from '#/components/tao-icons/CaretRight'
import {CaretUpIcon} from '#/components/tao-icons/CaretUp'
import {Text} from '#/components/Typography'
import {Like} from '../player/post-ctrls/Like'
import {useComments} from './CommentsProvider'

function _Comment({
  item,
  creatorDid,
  prevPost,
}: {
  item: ThreadPost
  creatorDid: string
  prevPost?: ThreadPost
}) {
  const postShadow = usePostShadow(item.post)
  const t = useTheme()
  const hasEmbed = !!item.post.embed
  const isCreator = item.post.author.did === creatorDid
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text:
          (hasEmbed && !item.record.text ? '(post embed not shown)' : '') +
          item.record.text,
        facets: item.record.facets,
      }),
    [item.record, hasEmbed],
  )

  const prevAuthor = prevPost?.post.author

  const {setReplyTo} = useComments()
  const doReply = useCallback(() => {
    const {uri, cid, author} = item.post
    setReplyTo({
      uri,
      cid,
      author,
      text: '',
    })
  }, [item, setReplyTo])

  return (
    <View style={[a.flex_row, a.px_sm, a.mb_md]}>
      <UserAvatar
        avatar={item.post.author.avatar}
        size={36}
        usePlainRNImage={true}
        type="user"
      />
      <View style={[a.pl_md, a.flex_1]}>
        <View style={[a.flex_row, a.align_start]}>
          <Text
            emoji
            numberOfLines={1}
            style={[t.atoms.text_contrast_medium, a.font_bold, a.mb_sm]}>
            {sanitizeDisplayName(
              item.post.author.displayName || item.post.author.handle,
            )}
          </Text>
          {isCreator && (
            <Text emoji style={[a.ml_md, a.font_bold, s.brandBlue]}>
              Creator
            </Text>
          )}
          {prevAuthor && (
            <>
              <CaretRightIcon
                size="sm"
                style={[
                  t.atoms.text_contrast_medium,
                  a.font_bold,
                  a.px_md,
                  {marginTop: 2},
                ]}
              />
              <Text
                emoji
                numberOfLines={1}
                style={[t.atoms.text_contrast_medium, a.font_bold, a.mb_sm]}>
                {sanitizeDisplayName(
                  prevAuthor.displayName || prevAuthor.handle,
                )}
              </Text>
            </>
          )}
        </View>
        <RichText value={richText} style={[a.text_sm, a.mb_sm]} />
        <View style={[a.flex_row, a.align_center]}>
          <TimeElapsed timestamp={item.record.createdAt}>
            {({timeElapsed}) => (
              <Text style={[t.atoms.text_contrast_medium, a.font_bold]}>
                {timeElapsed}
              </Text>
            )}
          </TimeElapsed>
          <View style={[a.flex_1, a.px_md]}>
            <Pressable accessibilityRole="button" onPress={doReply}>
              <Text style={[t.atoms.text_contrast_medium, a.font_heavy]}>
                Reply
              </Text>
            </Pressable>
          </View>
          {postShadow !== POST_TOMBSTONE && (
            <View>
              <Like post={postShadow} logContext="PostThreadItem" />
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
const Comment = memo(_Comment)

function _CommentReplies({
  items,
  creatorDid,
}: {
  items: ThreadPost[]
  creatorDid: string
}) {
  const t = useTheme()
  const [showCount, setShowCount] = useState(0)
  const shownReplies = useMemo(() => {
    if (showCount === 0) {
      return []
    }
    return items.slice(0, showCount)
  }, [items, showCount])
  const showMore = useCallback(() => {
    setShowCount(c => Math.min(c + 3, items.length))
  }, [items.length, setShowCount])
  const hideAll = useCallback(() => {
    setShowCount(0)
  }, [setShowCount])
  const expanderText = `${items.length - showCount} ${
    showCount === 0 ? '' : 'more '
  }repl${items.length - showCount === 1 ? 'y' : 'ies'}`
  return (
    <View style={[{marginLeft: 48}]}>
      {shownReplies.map((sr, i) => (
        <Comment
          item={sr}
          creatorDid={creatorDid}
          prevPost={i === 0 ? undefined : shownReplies[i - 1]}
          key={sr._reactKey}
        />
      ))}
      <View style={[a.pl_sm, a.flex_row, a.align_center]}>
        <View
          style={{
            height: 1,
            width: 40,
            backgroundColor: t.atoms.text_contrast_medium.color,
          }}
        />
        {showCount < items.length && (
          <Pressable accessibilityRole="button"
            onPress={() => showMore()}
            style={[a.flex_row, a.align_center, a.mr_xl]}>
            <Text
              style={[
                a.px_sm,
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.font_bold,
              ]}>
              {expanderText}
            </Text>
            <CaretDownIcon
              size="sm"
              style={[t.atoms.text_contrast_medium, a.font_bold]}
            />
          </Pressable>
        )}
        {showCount > 0 && (
          <Pressable accessibilityRole="button"
            onPress={() => hideAll()}
            style={[a.flex_row, a.align_center]}>
            <Text
              style={[
                a.px_sm,
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.font_bold,
              ]}>
              Hide
            </Text>
            <CaretUpIcon
              size="sm"
              style={[t.atoms.text_contrast_medium, a.font_bold]}
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}
const CommentReplies = memo(_CommentReplies)

function CommentGroup({
  comments,
  creatorDid,
}: {
  comments: ThreadPost[]
  creatorDid: string
}) {
  const [top, ...rest] = comments
  return (
    <View style={a.mb_2xl}>
      <Comment item={top} key={top._reactKey} creatorDid={creatorDid} />
      {rest && rest.length > 0 && (
        <CommentReplies items={rest} creatorDid={creatorDid} />
      )}
    </View>
  )
}

export default memo(CommentGroup)
