import {useState} from 'react'
import {Linking, Modal, TouchableOpacity, View} from 'react-native'
import {FontAwesome, FontAwesome5} from '@expo/vector-icons'
import {useTheme} from '@react-navigation/native'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

const rankColors: Record<string, string> = {
  Dangerous: '#e0245e',
  Cautioned: '#ffad1f',
  Credible: '#cfc9bb',
  Reliable: '#17bf63',
  Genuine: '#1d9bf0',
}

function qualifiesForSpecialBadge(profile: {
  authorRank: string
  dataConfigurations: any[]
}) {
  if (!profile.dataConfigurations) {
    return null
  }
  const disallowed = ['Dangerous', 'Cautioned']
  if (disallowed.includes(profile.authorRank)) return false

  return profile.dataConfigurations.some(d => d.dataPointType === 'tiktok')
}

export function TruAnonBadgeIcon({
  prefs,
  profile,
  color,
}: {
  profile: {authorRank: string; dataConfigurations: any[]} | null
  prefs?: {
    wants_verified?: number
    wants_personal?: number
    wants_social?: number
    wants_private?: number
  }
  color?: string
}) {
  const [isModalVisible, setModalVisible] = useState(false)
  const {colors} = useTheme()

  if (!profile || Object.keys(profile).length === 0) return null
  // console.log('profile == ', profile)

  const authorRank = profile.authorRank ?? 'Unknown'
  const iconColor = color || rankColors[authorRank] || '#999'
  const useRibbon = qualifiesForSpecialBadge(profile)
  const ribbonText = useRibbon ? 'TikTok Verified' : 'No Ribbon'

  const toggleModal = () => setModalVisible(!isModalVisible)

  const rankExplanations: Record<string, string> = {
    Dangerous:
      'A Dangerous report signals avoiding transparency —high risk, no visibility.',
    Cautioned:
      'Cautioned shows partial validation and limited public exposure.',
    Credible:
      'Credible means ID-level confidence backed with continuous public validation.',
    Reliable:
      'Reliable represents ongoing visible consistency and extensive public oversight.',
    Genuine:
      'Genuine indicates peak confidence from long-term consistency and transparency.',
  }
  return (
    <View style={{marginLeft: 6}}>
      <TouchableOpacity accessibilityRole="button" onPress={toggleModal}>
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
          <FontAwesome5
            name="ribbon"
            size={a.text_2xl.fontSize * 1.3}
            color={iconColor}
          />
        ) : (
          <FontAwesome
            name="check-circle"
            size={a.text_2xl.fontSize * 1.3}
            color={iconColor}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        onRequestClose={toggleModal}
        transparent
        animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}>
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 14,
              padding: 0,
              width: 320,
              overflow: 'hidden',
            }}>
            {/* Jumbotron */}
            <View
              style={{
                backgroundColor: '#F0F2F5',
                margin: 18,
                padding: 8,
                marginBottom: 0,
                paddingVertical: 32,
                alignItems: 'center',
                borderRadius: 8,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                }}>
                <View style={{alignItems: 'center', flex: 1}}>
                  <FontAwesome5
                    name="ribbon"
                    size={a.text_2xl.fontSize * 2}
                    color={iconColor}
                  />
                  <Text
                    style={{
                      fontSize: a.text_xs.fontSize,
                      color: '#333',
                      marginTop: 8,
                      textAlign: 'center',
                    }}>
                    {ribbonText}
                  </Text>
                </View>

                <View style={{alignItems: 'center', flex: 1}}>
                  <FontAwesome
                    name="check-circle"
                    size={a.text_2xl.fontSize * 2}
                    color={iconColor}
                  />
                  <Text
                    style={{
                      fontSize: a.text_xs.fontSize,
                      textAlign: 'center',
                      color: '#333',
                      marginTop: 8,
                    }}>
                    {profile.authorRank} Rank
                  </Text>
                </View>
              </View>
            </View>

            <View style={{padding: 18}}>
              <Text
                style={{
                  fontSize: a.text_xl.fontSize,
                  fontWeight: '600',
                  color: '#0C0F14',
                  marginBottom: a.text_sm.fontSize,
                }}>
                This is a {profile.authorRank} badge-wearing member
              </Text>

              <Text
                style={{
                  fontSize: a.text_xs.fontSize,
                  fontWeight: '400',
                  color: '#181B1F',
                  marginBottom: a.text_xl.fontSize * 2,
                }}>
                {prefs?.wants_private
                  ? 'This profile is private, there are no active identity links. '
                  : ''}
                {rankExplanations[profile.authorRank] || ''} A Ribbon denotes a
                Credible+ rank with a validated TikTok account.
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => Linking.openURL('https://tao.social/verify')}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    borderRadius: 6,
                    marginRight: 8,
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: '600',
                      fontSize: a.text_xs.fontSize,
                    }}>
                    Learn more
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={toggleModal}
                  style={{
                    borderColor: colors.primary,
                    borderWidth: 1,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    borderRadius: 6,
                  }}>
                  <Text
                    style={{
                      fontSize: a.text_xs.fontSize,
                      color: colors.primary,
                      fontWeight: '600',
                    }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
