import {memo} from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {useComments} from './CommentsProvider'
import ThreadMenu from './ThreadMenu'

export default memo(function CommentsHeader() {
  const t = useTheme()
  const {title, sortReplies, setSortReplies} = useComments()

  return (
    <View>
      <View style={[a.flex_row, a.justify_center, a.py_sm]}>
        <View
          style={[
            a.rounded_sm,
            {
              width: 35,
              height: 5,
              alignSelf: 'center',
              backgroundColor: t.palette.contrast_975,
              opacity: 0.5,
            },
          ]}
        />
      </View>
      <View style={[a.flex_row, a.justify_center, a.align_center, a.mb_md]}>
        <Text style={[a.text_md, a.font_bold]}>{title}</Text>
        <ThreadMenu sortReplies={sortReplies} setSortReplies={setSortReplies} />
      </View>
    </View>
  )
})
