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

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function TruAnonVerificationSwitch({
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

  const t = useTheme()
  const isVerified = Boolean(assignedUrl && assignedUrl.trim())

  const closeModal = () => {
    setShowWebModal(false)
    onVerified?.()
  }

  const handleSwitchChange = (key: string, value: boolean) => {
    if (!prefs) return // Prevent updating if prefs is undefined
    const updatedPrefs = {
      wants_verified: prefs?.wants_verified ?? 0,
      wants_personal: prefs?.wants_personal ?? 0,
      wants_social: prefs?.wants_social ?? 0,
      wants_private: prefs?.wants_private ?? 0,
      [key]: value ? 1 : 0, // Store 1 for true and 0 for false
    }
    console.log('Switch changed:', key, value, updatedPrefs)
    setPrefs(updatedPrefs) // Update prefs state
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
              sharedCookiesEnabled={true}
              javaScriptEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              domStorageEnabled={true}
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
              backgroundColor: isVerified ? '#1d9bf0' : '#17bf63',
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
            <View>
              <View style={[a.pl_md]}>
                <View style={[a.flex_row, a.justify_between, a.items_center]}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    Use Verified Identity
                  </Text>
                  <Switch
                    value={prefs?.wants_verified === 1} // Check for value as 1 for true
                    onValueChange={v => handleSwitchChange('wants_verified', v)} // Handle switch change
                    trackColor={{false: '#444', true: '#1d9bf0'}}
                    thumbColor="#fff"
                  />
                </View>
                <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
                  Turns off verified identity, showing only "Unknown"
                </Text>
              </View>
            </View>

            <View style={[a.pl_md]}>
              <View>
                <View style={[a.flex_row, a.justify_between, a.items_center]}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    Display Personal Info
                  </Text>
                  <Switch
                    value={prefs?.wants_personal === 1} // Check for value as 1 for true
                    disabled={!prefs?.wants_verified} // Disable if not verified
                    onValueChange={v => handleSwitchChange('wants_personal', v)} // Handle switch change
                    trackColor={{false: '#444', true: '#1d9bf0'}}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </View>

            <View style={[a.pl_md]}>
              <View>
                <View style={[a.flex_row, a.justify_between, a.items_center]}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    Display Social Profiles
                  </Text>
                  <Switch
                    value={prefs?.wants_social === 1} // Check for value as 1 for true
                    disabled={!prefs?.wants_verified} // Disable if not verified
                    onValueChange={v => handleSwitchChange('wants_social', v)} // Handle switch change
                    trackColor={{false: '#444', true: '#1d9bf0'}}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </View>

            <View style={[a.pl_md]}>
              <View>
                <View style={[a.flex_row, a.justify_between, a.items_center]}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    Private Profile
                  </Text>
                  <Switch
                    value={prefs?.wants_private === 1} // Check for value as 1 for true
                    disabled={!prefs?.wants_verified} // Disable if not verified
                    onValueChange={v => handleSwitchChange('wants_private', v)} // Handle switch change
                    trackColor={{false: '#444', true: '#1d9bf0'}}
                    thumbColor="#fff"
                  />
                </View>
              </View>
              <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
                Turns off all links and assures privacy
              </Text>
            </View>
          </View>
        )}

        <View style={([a.mt_lg, a.mb_lg], {paddingBottom: 44, paddingTop: 16})}>
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
