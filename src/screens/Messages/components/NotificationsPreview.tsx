import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {Link} from '#/components/Link'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'

export function NotificationsPreview() {
  const {_} = useLingui()
  const t = useTheme()
  const unreadNotifs = useUnreadNotifications()
  return (
    <Link
      label={_(msg`Notifications`)}
      style={[
        a.flex_1,
        a.px_xl,
        a.py_sm,
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.border_t,
        {marginTop: a.border_t.borderTopWidth * -1},
        a.border_b,
        t.atoms.border_contrast_low,
        {minHeight: 44},
        a.rounded_0,
      ]}
      to="/messages/notifications"
      color="secondary"
      variant="solid">
      <View style={[a.relative]}>
        <ButtonIcon icon={BellIcon} size="lg" />
        {unreadNotifs && (
          <View
            style={[
              a.absolute,
              a.rounded_full,
              a.z_20,
              {
                top: -4,
                right: -5,
                width: 10,
                height: 10,
                backgroundColor: t.palette.primary_500,
              },
            ]}
          />
        )}
      </View>
      <ButtonText
        style={[a.flex_1, a.font_bold, a.text_left]}
        numberOfLines={1}>
        <Trans>Notifications</Trans>
      </ButtonText>
      <ButtonIcon icon={ArrowRightIcon} size="lg" />
    </Link>
  )
}
