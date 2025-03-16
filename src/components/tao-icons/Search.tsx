import React from 'react'
import Svg, {Path} from 'react-native-svg'
import {Props, useCommonSVGProps} from '../icons/common'

export const SearchIcon = React.forwardRef<Svg, Props>(function LogoImpl(
  props,
  ref,
) {
  const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)

  return (
    <Svg
      fill="none"
      {...rest}
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={[style]}>
      {gradient}
      <Path
        fill="none"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 21L16.7 16.7M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
})
