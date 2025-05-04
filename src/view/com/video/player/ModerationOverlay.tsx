import {useCallback} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {EyeSlash_Stroke2_Corner0_Rounded as Eye} from '#/components/icons/EyeSlash'
import * as Hider from '#/components/moderation/Hider'
import {Text} from '#/components/Typography'
import {VideoItemPlaceholder} from './VideoItemPlaceholder'

export function ModerationOverlay({
  embed,
  onPressShow,
}: {
  embed: AppBskyEmbedVideo.View
  onPressShow: () => void
}) {
  const {_} = useLingui()
  const hider = Hider.useHider()
  const {bottom} = useSafeAreaInsets()

  const onShow = useCallback(() => {
    hider.setIsContentVisible(true)
    onPressShow()
  }, [hider, onPressShow])

  return (
    <View style={[a.absolute, a.inset_0, a.z_20]}>
      <VideoItemPlaceholder blur embed={embed} />
      <View
        style={[
          a.absolute,
          a.inset_0,
          a.z_20,
          a.justify_center,
          a.align_center,
          {backgroundColor: 'rgba(0, 0, 0, 0.8)'},
        ]}>
        <View style={[a.align_center, a.gap_sm]}>
          <Eye width={36} fill="white" />
          <Text style={[a.text_center, a.leading_snug, a.pb_xs]}>
            <Trans>Hidden by your moderation settings.</Trans>
          </Text>
          <Button
            label={_(msg`Show anyway`)}
            size="small"
            variant="solid"
            color="secondary_inverted"
            onPress={onShow}>
            <ButtonText>
              <Trans>Show anyway</Trans>
            </ButtonText>
          </Button>
        </View>
        <View
          style={[
            a.absolute,
            a.inset_0,
            a.px_xl,
            a.pt_4xl,
            {
              top: 'auto',
              paddingBottom: bottom,
            },
          ]}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
            style={[a.absolute, a.inset_0]}
          />
          <Divider style={{borderColor: 'white'}} />
          <View>
            <Button
              label={_(msg`View details`)}
              onPress={() => {
                hider.showInfoDialog()
              }}
              style={[
                a.w_full,
                {
                  height: 60,
                },
              ]}>
              {({pressed}) => (
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    a.text_center,
                    {opacity: pressed ? 0.5 : 1},
                  ]}>
                  <Trans>View details</Trans>
                </Text>
              )}
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
