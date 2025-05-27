import React from 'react'
import Svg, {Circle, G, Path} from 'react-native-svg'

import {Props, useCommonSVGProps} from '../icons/common'

export const AuthorFollowingIcon = React.forwardRef<Svg, Props>(
  function LogoImpl(props, ref) {
    const {size, shadow} = useCommonSVGProps(props)

    return (
      <Svg fill="none" ref={ref} viewBox="0 0 32 32" width={size} height={size}>
        {shadow}
        <G filter={shadow ? 'url(#DropShadow)' : undefined}>
          <Circle cx="16" cy="15" r="12" fill="#6e5ce5" />
        </G>
        <Path
          d="M21.3333 11L14 18.3333L10.6666 15"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )
  },
)
