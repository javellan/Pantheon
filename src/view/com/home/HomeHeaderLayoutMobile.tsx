import React from 'react'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useMinimalShellHeaderTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const {headerHeight} = useShellLayout()
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()
  const insets = useSafeAreaInsets()

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
          {paddingRight: Layout.HEADER_SLOT_SIZE},
        ]}
        onLayout={e => {
          headerHeight.set(e.nativeEvent.layout.height)
        }}>
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.Slot>
            <Layout.Header.MenuButton transparent />
          </Layout.Header.Slot>
          {children}
        </Layout.Header.Outer>
      </Animated.View>
    </>
  )
}
