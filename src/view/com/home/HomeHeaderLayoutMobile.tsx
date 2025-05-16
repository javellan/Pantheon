import React from 'react'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {HITSLOP_10} from '#/lib/constants'
import {useMinimalShellHeaderTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useShellLayout} from '#/state/shell/shell-layout'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {Hash} from 'lucide-react-native'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const {_} = useLingui()
  const {headerHeight} = useShellLayout()
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()
  const insets = useSafeAreaInsets()
  const t = useTheme()

  return (
    <>
      <Animated.View
        style={[
          a.fixed,
          a.z_10,
          {
            top: insets.top,
            left: 0,
            right: 0,
          },
          headerMinimalShellTransform,
        ]}
        onLayout={e => {
          headerHeight.set(e.nativeEvent.layout.height)
        }}>
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.Slot>
            <Layout.Header.MenuButton transparent />
          </Layout.Header.Slot>
          {children}
          <Layout.Header.Slot>
            <Link
              testID="viewHeaderHomeFeedPrefsBtn"
              to="/feeds"
              hitSlop={HITSLOP_10}
              label={_(msg`View your feeds and explore more`)}
              size="small"
              variant="ghost"
              color="secondary"
              shape="square"
              style={[
                a.justify_center,
                {
                  marginRight: -Layout.BUTTON_VISUAL_ALIGNMENT_OFFSET,
                },
                a.bg_transparent,
              ]}>
              <Hash
                size={24}
                color={t.atoms.text.color}
                style={a.icon_shadow_dark}
              />
            </Link>
          </Layout.Header.Slot>
        </Layout.Header.Outer>
      </Animated.View>
    </>
  )
}
