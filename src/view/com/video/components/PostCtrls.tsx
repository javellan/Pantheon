import React, {memo} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'

import {Shadow} from '#/state/cache/types'
import {atoms as a} from '#/alf'
import {Author} from './post-ctrls/Author'
import {Comment} from './post-ctrls/Comment'
import {Like} from './post-ctrls/Like'
import {Repost} from './post-ctrls/Repost'
import {Share} from './post-ctrls/Share'

let PostCtrls = ({
  big,
  post,
  feedContext,
  style,
  onPressReply,
  onPostReply,
  logContext,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  feedContext?: string | undefined
  style?: StyleProp<ViewStyle>
  onPressReply: () => void
  onPostReply?: (postUri: string | undefined) => void
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
}): React.ReactNode => {
  return (
    <View style={[a.justify_between, a.align_center, style, a.pr_sm]}>
      <View style={[a.mb_xl]}>
        <Author post={post} />
      </View>
      <View style={[a.mb_md]}>
        <Like
          post={post}
          feedContext={feedContext}
          logContext={logContext}
          big={big}
        />
      </View>
      <View style={[a.mb_md]}>
        <Comment post={post} big={big} onPressReply={onPressReply} />
      </View>
      <View style={[a.mb_md]}>
        <Repost
          post={post}
          big={big}
          feedContext={feedContext}
          logContext={logContext}
          onPostReply={onPostReply}
        />
      </View>
      <Share post={post} big={big} feedContext={feedContext} style={style} />
    </View>
  )
}
PostCtrls = memo(PostCtrls)
export {PostCtrls}
