import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {Leaf_Stroke2_Corner0_Rounded as LeafIcon} from '#/components/icons/Leaf'
import {Text} from '#/components/Typography'

/*
 * We've removed the navigation components because this should be
 * modularly injectable into a regular feed instead of as a
 * seperate route
 */

export function EndMessage() {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.gap_3xl,
        a.px_lg,
        a.mx_auto,
        a.align_center,
        {maxWidth: 350},
      ]}>
      <View
        style={[
          {height: 100, width: 100},
          a.rounded_full,
          t.atoms.bg_contrast_700,
          a.align_center,
          a.justify_center,
        ]}>
        <LeafIcon width={64} fill="black" />
      </View>
      <View style={[a.w_full, a.gap_md]}>
        <Text style={[a.text_3xl, a.text_center, a.font_heavy]}>
          <Trans>That's everything!</Trans>
        </Text>
        <Text
          style={[
            a.text_lg,
            a.text_center,
            t.atoms.text_contrast_high,
            a.leading_snug,
          ]}>
          <Trans>
            You've run out of videos to watch. Maybe it's a good time to take a
            break?
          </Trans>
        </Text>
      </View>
    </View>
  )
}
