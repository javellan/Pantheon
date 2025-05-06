import {memo, useCallback} from 'react'
import {ListRenderItem, View} from 'react-native'
import {FlatList} from 'react-native-gesture-handler'

import {ThreadPost} from '#/state/queries/post-thread'
import {atoms as a, useTheme} from '#/alf'
import {MessageSolidIcon} from '#/components/tao-icons/MessageSolid'
import {Text} from '#/components/Typography'
import CommentGroup from './CommentGroup'
import {useComments} from './CommentsProvider'

const NoComments = memo(function NoComments() {
  const t = useTheme()
  return (
    <View style={[a.flex_1, a.justify_center, a.align_center]}>
      <View
        style={[
          a.justify_center,
          a.align_center,
          t.atoms.bg_contrast_500,
          a.rounded_full,
          a.p_2xl,
          a.mb_lg,
        ]}>
        <MessageSolidIcon
          size="feckinhuge"
          style={[{color: t.atoms.bg.backgroundColor}, a.m_md]}
        />
      </View>
      <Text style={a.text_md}>Comments will appear here</Text>
    </View>
  )
})

export default memo(function CommentList() {
  const {commentCount, creatorDid, comments} = useComments()

  const renderItem: ListRenderItem<ThreadPost[]> = useCallback(
    ({item}) => <CommentGroup comments={item} creatorDid={creatorDid} />,
    [creatorDid],
  )

  return commentCount === 0 ? (
    <NoComments />
  ) : (
    <FlatList
      style={a.flex_1}
      data={comments}
      initialNumToRender={50}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item[0]._reactKey}#${index}`}
    />
  )
})
