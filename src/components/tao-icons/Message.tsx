import React from 'react'
import Svg, {Path} from 'react-native-svg'
import {Props, useCommonSVGProps} from '../icons/common'

export const MessageIcon = React.forwardRef<Svg, Props>(function LogoImpl(
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
        stroke={fill}
        d="M8 12H8.01M12 12H12.01M16 12H16.01M7.9 20C9.80858 20.9791 12.0041 21.2443 14.0909 20.7478C16.1777 20.2514 18.0186 19.0259 19.2818 17.2922C20.545 15.5586 21.1474 13.4308 20.9806 11.2922C20.8137 9.15366 19.8886 7.14502 18.3718 5.62824C16.855 4.11146 14.8464 3.1863 12.7078 3.01946C10.5693 2.85263 8.44147 3.45509 6.70782 4.71829C4.97417 5.98149 3.74869 7.82236 3.25222 9.90916C2.75575 11.996 3.02094 14.1915 4 16.1L2 22L7.9 20Z"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
})
