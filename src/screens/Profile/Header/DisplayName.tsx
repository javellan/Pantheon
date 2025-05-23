import {View} from 'react-native'
import {AppBskyActorDefs, ModerationDecision} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Shadow} from '#/state/cache/types'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {TruAnonBadgeIcon} from '#/components/truanon/TruAnonBadgeIcon'
import {Text} from '#/components/Typography'

export function ProfileHeaderDisplayName({
  profile,
  prefs,
  moderation,
  truAnonData,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  prefs?: {
    wants_verified?: number
    wants_personal?: number
    wants_social?: number
    wants_private?: number
  }
  moderation: ModerationDecision
  truAnonData?: any
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <View style={[a.flex_row, a.align_center]}>
      <Text
        emoji
        testID="profileHeaderDisplayName"
        pointerEvents="none"
        style={[
          t.atoms.text,
          gtMobile ? a.text_4xl : a.text_3xl,
          a.self_start,
          a.font_heavy,
        ]}>
        {sanitizeDisplayName(
          profile.displayName || sanitizeHandle(profile.handle),
          moderation.ui('displayName'),
        )}
      </Text>
      <View style={{marginLeft: 0}}>
        <TruAnonBadgeIcon profile={truAnonData} prefs={prefs} />
      </View>
    </View>
  )
}
