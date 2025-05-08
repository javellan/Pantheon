import {FontAwesome, FontAwesome5} from '@expo/vector-icons'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

const rankColors: Record<string, string> = {
  Dangerous: '#e0245e',
  Cautioned: '#ffad1f',
  Credible: '#fff',
  Reliable: '#17bf63',
  Genuine: '#1d9bf0',
}

function qualifiesForSpecialBadge(profile: {
  authorRank: string
  dataConfigurations: any[]
}) {
  const disallowed = ['Dangerous', 'Cautioned']
  if (disallowed.includes(profile.authorRank)) return false

  const hasBluesky = profile.dataConfigurations.some(
    d => d.dataPointType === 'bskyapp',
  )
  const hasTiktok = profile.dataConfigurations.some(
    d => d.dataPointType === 'tiktok',
  )

  return hasBluesky && hasTiktok
}

export function TruAnonBadgeIcon({
  profile,
  color,
}: {
  profile: {authorRank: string; dataConfigurations: any[]} | null
  color?: string
}) {
  if (!profile || profile.authorRank === 'Unknown') return null

  const iconColor = color || rankColors[profile.authorRank] || '#999'
  const useRibbon = qualifiesForSpecialBadge(profile)

  return (
    <Text style={{marginLeft: 6}}>
      {useRibbon ? (
        // Amusing Alternatives:
        // trophy
        // drumstick-bite
        // head-side-cough-slash
        // dizzy
        // brain
        // check-double
        // pied-piper-hat
        // sticker-mule
        // galactic-republic
        // medal
        // crown
        // star-half-alt
        // dove
        // kiwi-bird
        // toilet-paper
        // skull-crossbones
        // ban
        // gem
        // cookie-bite
        // hand-middle-finger

        <FontAwesome5
          name="ribbon"
          size={a.text_2xl.fontSize}
          color={iconColor}
        />
      ) : (
        <FontAwesome
          name="check-circle"
          size={a.text_2xl.fontSize}
          color={iconColor}
        />
      )}
    </Text>
  )
}
