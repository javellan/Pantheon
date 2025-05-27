import Svg, {G, PathProps, SvgProps, Text, TSpan} from 'react-native-svg'

export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  return (
    <Svg width="300px" height="50px" viewBox="0 0 1000 200">
      <G transform="matrix(1,0,0,1,-112.062,-823.656)">
        <Text
          x="110"
          y="960"
          fontFamily="Candara-Bold"
          fontWeight="700"
          fontSize="192"
          fill={fill}>
          T
          <TSpan x="207.125 328.063" y="960 960">
            AO{' '}
          </TSpan>
          <TSpan x="470" y="960">
            {' '}
            Social
          </TSpan>
        </Text>
      </G>
    </Svg>
  )
}
