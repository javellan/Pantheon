import {useState} from 'react'
import {
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native'
import {WebView} from 'react-native-webview'
import {Trans} from '@lingui/macro'

import {
  getTruAnonBadgeColor,
  useTruAnonBadgeRankMutation,
} from '#/state/queries/profile'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function TruAnonVerificationSwitch({
  did,
  verifyUrl,
  assignedUrl,
  onVerified,
  prefs,
  setPrefs,
}: {
  verifyUrl?: string
  assignedUrl?: string
  prefs?: {
    wants_verified?: number
    wants_personal?: number
    wants_social?: number
    wants_private?: number
  }
  setPrefs: (prefs: {
    wants_verified: number
    wants_personal: number
    wants_social: number
    wants_private: number
  }) => void
  onVerified?: () => void
}) {
  const [showWebModal, setShowWebModal] = useState(false)
  const {mutate: setBadgeRank} = useTruAnonBadgeRankMutation()
  const t = useTheme()
  const isVerified = Boolean(assignedUrl?.trim())

  const effectivePrefs = {
    wants_verified: prefs?.wants_verified ?? 1,
    wants_personal: prefs?.wants_personal ?? 1,
    wants_social: prefs?.wants_social ?? 1,
    wants_private: prefs?.wants_private ?? 0,
  }

  const closeModal = () => {
    setShowWebModal(false)
    onVerified?.()
  }

  const handleSwitchChange = (key: string, value: boolean) => {
    const updatedPrefs = {
      wants_verified: effectivePrefs.wants_verified,
      wants_personal: effectivePrefs.wants_personal,
      wants_social: effectivePrefs.wants_social,
      wants_private: effectivePrefs.wants_private,
      [key]: value ? 1 : 0,
    }

    if (key === 'wants_verified' && !value) {
      setBadgeRank({did, badge: null})
    }

    setPrefs(updatedPrefs)
  }

  return (
    <>
      <Modal
        visible={showWebModal}
        animationType="slide"
        onRequestClose={closeModal}
        presentationStyle="fullScreen"
        hardwareAccelerated>
        <SafeAreaView
          style={[
            {flex: 1},
            {backgroundColor: t.atoms.bg.backgroundColor},
            {
              paddingTop:
                Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0,
            },
          ]}>
          <StatusBar
            backgroundColor={t.atoms.bg.backgroundColor}
            barStyle="light-content"
            translucent={false}
          />
          <View
            style={[
              a.flex_row,
              a.items_center,
              a.justify_end,
              a.p_md,
              a.border_b,
              a.border_contrast_25,
              {backgroundColor: t.atoms.bg.backgroundColor},
            ]}>
            <TouchableOpacity accessibilityRole="button" onPress={closeModal}>
              <Text style={[a.text_md, a.text_link]}>
                <Trans>Done</Trans>
              </Text>
            </TouchableOpacity>
          </View>
          {verifyUrl ? (
            <WebView
              key={verifyUrl}
              source={{uri: verifyUrl}}
              onMessage={event => {
                if (event.nativeEvent.data === 'windowClose') {
                  closeModal()
                }
              }}
              originWhitelist={['*']}
              cacheEnabled={false}
              sharedCookiesEnabled
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              domStorageEnabled
              startInLoadingState
              style={{flex: 1, backgroundColor: '#000'}}
            />
          ) : (
            <View style={[a.flex_1, a.items_center, a.justify_center]}>
              <Text style={[a.text_sm, a.text_contrast_medium]}>
                <Trans>Loading…</Trans>
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <View style={[a.gap_sm]}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            if (isVerified && assignedUrl) {
              Linking.openURL(`https://${assignedUrl}`)
            } else if (verifyUrl) {
              setShowWebModal(true)
            }
          }}
          style={[
            {
              backgroundColor: isVerified
                ? getTruAnonBadgeColor('Genuine')
                : getTruAnonBadgeColor('Reliable'),
              shadowColor: '#000',
              shadowOffset: {width: 1, height: 2},
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
              borderRadius: 9999,
            },
            a.px_md,
            a.py_sm,
            a.rounded_lg,
            isVerified && a.border,
            isVerified && a.border_contrast_100,
            a.align_center,
          ]}>
          <Text
            style={[
              a.text_sm,
              {
                color: '#eee',
                fontWeight: 'bold',
              },
            ]}>
            {isVerified ? assignedUrl : <Trans>Verify</Trans>}
          </Text>
        </TouchableOpacity>

        {isVerified && (
          <View style={[a.mt_md, a.gap_md]}>
            {['verified', 'personal', 'social', 'private'].map(key => (
              <View key={key} style={[a.pl_md]}>
                <View style={[a.flex_row, a.justify_between, a.items_center]}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {
                      {
                        verified: 'Use Verified Identity',
                        personal: 'Display Personal Info',
                        social: 'Display Social Profiles',
                        private: 'Private Profile',
                      }[key]
                    }
                  </Text>
                  <Switch
                    value={effectivePrefs[`wants_${key}`] === 1}
                    disabled={key !== 'verified' && !prefs?.wants_verified}
                    onValueChange={v => handleSwitchChange(`wants_${key}`, v)}
                    trackColor={{
                      false: '#444',
                      true: getTruAnonBadgeColor('Genuine'),
                    }}
                    thumbColor="#fff"
                  />
                </View>
                {key === 'verified' && (
                  <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
                    Turns off verified identity, showing only "Unknown"
                  </Text>
                )}
                {key === 'private' && (
                  <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
                    Turns off all links and assures privacy
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{paddingBottom: 44, paddingTop: 16}}>
          <Text style={[a.text_sm, a.text_contrast_low]}>
            {isVerified ? (
              <Trans />
            ) : (
              <Trans>
                A verified badge shows you’re real, credible, and worth
                engaging. It means you care enough to be reliable and trusted.
                It is extending a hand of good faith and accountability.
              </Trans>
            )}
          </Text>
        </View>
      </View>
    </>
  )
}
