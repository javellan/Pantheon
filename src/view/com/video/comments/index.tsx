import {memo} from 'react'
import {View} from 'react-native'
import {
  GestureDetector,
  NativeGesture,
  PanGesture,
} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import {VideoData} from '../ClearlightFeed'
import CommentList from './CommentList'
import CommentReply from './CommentReply'
import CommentsHeader from './CommentsHeader'
import {CommentsProvider} from './CommentsProvider'

const Comments = memo(function Comments({
  dragGesture,
  scrollGesture,
}: {
  dragGesture: PanGesture
  scrollGesture: NativeGesture
}) {
  const insets = useSafeAreaInsets()
  const t = useTheme()
  return (
    <GestureDetector gesture={dragGesture}>
      <>
        <View
          style={[a.flex_1, t.atoms.bg, {marginBottom: insets.bottom + 60}]}>
          <CommentsHeader />
          <CommentList />
        </View>
        <CommentReply scrollGesture={scrollGesture} />
      </>
    </GestureDetector>
  )
})

export default memo(function CommentsWrapper({
  data,
  active,
  dragGesture,
  scrollGesture,
}: {
  data: VideoData
  active: boolean
  dragGesture: PanGesture
  scrollGesture: NativeGesture
}) {
  return (
    <>
      {active && (
        <CommentsProvider uri={data.post.uri}>
          <Comments dragGesture={dragGesture} scrollGesture={scrollGesture} />
        </CommentsProvider>
      )}
    </>
  )
})
