import {useState} from 'react'
import {Linking, Modal, TouchableOpacity, View} from 'react-native'
import {FontAwesome, FontAwesome5} from '@expo/vector-icons'
import {useTheme} from '@react-navigation/native'

import {TruAnonBadge} from '#/state/queries/profile'
import {getTruAnonBadgeColor} from '#/state/queries/profile'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

export function TruAnonBadgeIcon({
  badge,
  prefs,
}: {
  badge: TruAnonBadge | null
  prefs?: {
    wants_verified?: number
    wants_private?: number
  }
}) {
  const [isModalVisible, setModalVisible] = useState(false)
  const {colors} = useTheme()

  if (!badge || !prefs?.wants_verified) return null

  const {rank, style} = badge
  const iconColor = getTruAnonBadgeColor(rank)
  const useRibbon = style === 'Ribbon'
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

  const toggleModal = () => setModalVisible(!isModalVisible)

  return (
    <View style={{marginLeft: 6}}>
      <TouchableOpacity accessibilityRole="button" onPress={toggleModal}>
        {useRibbon ? (
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
              width: 320,
              overflow: 'hidden',
            }}>
            <View
              style={{
                backgroundColor: '#F0F2F5',
                margin: 18,
                paddingVertical: 32,
                alignItems: 'center',
                borderRadius: 8,
              }}>
              <View style={{flexDirection: 'row', width: '100%'}}>
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
                    TikTok Verified
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
                    {rank} Rank
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
                This is a {rank} badge-wearing member
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
                {rankExplanations[rank] || ''} A Ribbon denotes a Credible+ rank
                with a validated TikTok account.
              </Text>

              <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
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
