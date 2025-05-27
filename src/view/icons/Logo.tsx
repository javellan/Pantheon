import {forwardRef} from 'react'

import {LogoIcon} from '#/components/tao-icons/Logo'

export const Logo = forwardRef(function LogoIconImpl(props: any, ref) {
  return <LogoIcon radialGradient="logo" size="feckinhuge" />
})
