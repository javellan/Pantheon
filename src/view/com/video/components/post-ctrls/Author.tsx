import {AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Shadow} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {PlusSmall_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Link} from '#/components/Link'

export function Author({post}: {post: Shadow<AppBskyFeedDefs.PostView>}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const handle = sanitizeHandle(post.author.handle, '@')
  const profile = useProfileShadow(post.author)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ImmersiveVideo',
  )

  return (
    <Link
      label={_(
        msg`View ${sanitizeDisplayName(
          post.author.displayName || post.author.handle,
        )}'s profile`,
      )}
      to={{
        screen: 'Profile',
        params: {name: post.author.did},
      }}
      style={[a.flex_row, a.gap_md, a.align_center]}>
      <UserAvatar type="user" avatar={post.author.avatar} size={48} />
      {post.author.did !== currentAccount?.did &&
        !post.author.viewer?.following && (
          <Button
            label={
              profile.viewer?.following
                ? _(msg`Following ${handle}`)
                : _(msg`Follow ${handle}`)
            }
            accessibilityHint={
              profile.viewer?.following ? _(msg`Unfollow user`) : ''
            }
            size="tiny"
            variant="solid"
            shape="round"
            color={profile.viewer?.following ? 'secondary_inverted' : 'primary'}
            style={[
              a.mb_xs,
              a.absolute,
              {
                top: '100%',
                right: '50%',
                marginRight: -11,
                marginTop: -11,
              },
            ]}
            onPress={() =>
              profile.viewer?.following ? queueUnfollow() : queueFollow()
            }>
            {profile.viewer?.following ? (
              <ButtonIcon icon={CheckIcon} />
            ) : (
              <ButtonIcon icon={PlusIcon} />
            )}
          </Button>
        )}
    </Link>
  )
}
