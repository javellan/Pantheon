import React from 'react'
import Svg, {Defs, Path, RadialGradient, Stop} from 'react-native-svg'

import {Props, useCommonSVGProps} from '../icons/common'

export const DoubleTapLikeHeartIcon = React.forwardRef<Svg, Props>(
  function LogoImpl(props, ref) {
    const {size} = useCommonSVGProps(props)

    return (
      <Svg fill="none" ref={ref} viewBox="0 0 81 81" width={size} height={size}>
        <Defs>
          <RadialGradient
            id="paint0_radial_191_4564"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(24.1029 25.9785) rotate(54.0395) scale(39.38 43.318)">
            <Stop stopColor="#FF7CBC" />
            <Stop offset="1" stopColor="#EC4899" />
          </RadialGradient>
        </Defs>
        <Path
          fill="url(#paint0_radial_191_4564)"
          d="M25.3533 7.02002C19.607 7.02002 14.096 9.30275 10.0327 13.366C5.96938 17.4293 3.68665 22.9403 3.68665 28.6867C3.68665 37.8514 9.66804 44.5468 14.6828 49.3969L37.9963 72.7104C39.298 74.0121 41.4086 74.0121 42.7103 72.7104L66.0317 49.3891C70.9887 44.5305 77.02 37.8261 77.02 28.6867C77.02 22.9403 74.7372 17.4293 70.674 13.366C66.6107 9.30275 61.0997 7.02002 55.3533 7.02002C52.086 7.02002 49.1094 7.4873 46.1973 8.75563C44.1543 9.64542 42.2463 10.8846 40.3533 12.4845C38.4603 10.8846 36.5523 9.64542 34.5093 8.75563C31.5973 7.4873 28.6206 7.02002 25.3533 7.02002Z"
        />
      </Svg>
    )
  },
)
