import {Linking, StyleSheet, TouchableOpacity, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {FontAwesome, FontAwesome5} from '@expo/vector-icons'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isInvalidHandle} from '#/lib/strings/handles'
import {isIOS} from '#/platform/detection'
import {Shadow} from '#/state/cache/types'
import {atoms as a, useTheme, web} from '#/alf'
import {NewskieDialog} from '#/components/NewskieDialog'
import {Text} from '#/components/Typography'

export function ProfileHeaderHandle({
  profile,
  disableTaps,
  truAnonData,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  disableTaps?: boolean
  truAnonData?: any
}) {
  const t = useTheme()
  const {_} = useLingui()
  const invalidHandle = isInvalidHandle(profile.handle)
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy

  const dataPointsOfTypeKind = (
    type: string,
    kind?: string,
  ): {value: string; iconClass: string}[] => {
    if (!truAnonData?.dataConfigurations) return []
    return truAnonData.dataConfigurations
      .filter(
        d =>
          d.dataPointType === type &&
          (kind === undefined || d.dataPointKind === kind),
      )
      .map(d => ({
        value: d.displayValue,
        iconClass: d.dataPointIconClass || '',
      }))
      .filter(d => d.value)
  }

  const renderLine = (
    entries: {value: string; iconClass: string}[],
    keyPrefix: string,
  ) => {
    if (entries.length === 0) return null
    const values = entries.map(e => e.value).join(', ')
    const parts = entries[0].iconClass.split(' ')
    const name = parts.find(p => p.startsWith('fa-'))?.replace('fa-', '') || ''

    return (
      <Text
        key={keyPrefix}
        style={[
          a.text_sm,
          a.font_bold,
          t.atoms.text_contrast_medium,
          {lineHeight: StyleSheet.flatten(a.text_sm).fontSize * 1.25}, // Tight line height
        ]}>
        <FontAwesome5
          name={name as any}
          size={StyleSheet.flatten(a.text_sm).fontSize}
          color="#fff"
        />{' '}
        {values}
      </Text>
    )
  }

  const renderTruAnon = () => {
    if (!truAnonData) return null
    const rankColors: Record<string, string> = {
      Dangerous: '#e0245e',
      Cautioned: '#ffad1f',
      Credible: '#fff',
      Reliable: '#17bf63',
      Genuine: '#1d9bf0',
    }
    const rankColor = rankColors[truAnonData.authorRank] || '#666'
    const isUnknown = truAnonData.authorRank === 'Unknown'

    const badgePill = (
      <View
        style={[
          a.flex_row,
          a.align_center,
          {
            alignSelf: 'flex-start',
            borderColor: rankColor,
            marginBottom: 4,
            borderWidth: 1,
            backgroundColor: '#000',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            gap: 10,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}>
        <Text style={{marginTop: 1}}>
          <FontAwesome
            name="check-circle"
            size={StyleSheet.flatten(a.text_sm).fontSize * 2.25}
            color={rankColor}
          />
        </Text>
        <View style={{flexShrink: 1, marginRight: 8}}>
          <Text style={[a.text_sm, a.font_bold, {color: '#fff'}]}>
            {truAnonData.authorRank}
          </Text>
          <Text style={[a.text_xs, {color: '#fff'}]}>
            {isUnknown
              ? 'Ask Me To Verify Identity'
              : `${truAnonData.authorRankScore ?? '–'} of 5`}
          </Text>
        </View>
      </View>
    )
    const birthdayData = dataPointsOfTypeKind('birthday', 'personal')
    const locationData = dataPointsOfTypeKind('location', 'personal')
    const genderData = dataPointsOfTypeKind('gender', 'personal')

    return (
      <View style={{marginTop: 8, marginBottom: 4}}>
        {truAnonData?.truAnonUrl && !isUnknown ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.5}
            onPress={() => Linking.openURL(`https://${truAnonData.truAnonUrl}`)}
            style={{marginBottom: 8}}>
            {badgePill}
          </TouchableOpacity>
        ) : (
          <View style={{marginBottom: 4}}>{badgePill}</View>
        )}
        {!isUnknown && (
          <View style={{marginBottom: 8}}>
            <Text
              style={[
                a.text_sm,
                a.font_bold,
                t.atoms.text_contrast_medium,
                {
                  flexWrap: 'wrap',
                  lineHeight: StyleSheet.flatten(a.text_sm).fontSize * 1.25,
                },
              ]}>
              {renderLine(locationData, 'location')}
              {'   '}
              {renderLine(birthdayData, 'birthday')}
              {'   '}
              {renderLine(genderData, 'gender')}
            </Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <>
      <View
        style={[a.flex_row, a.gap_xs, a.align_center, {maxWidth: '100%'}]}
        pointerEvents={disableTaps ? 'none' : isIOS ? 'auto' : 'box-none'}>
        <NewskieDialog profile={profile} disabled={disableTaps} />
        {profile.viewer?.followedBy && !blockHide ? (
          <View
            style={[t.atoms.bg_contrast_25, a.rounded_xs, a.px_sm, a.py_xs]}>
            <Text style={[t.atoms.text, a.text_sm]}>
              <Trans>Follows you</Trans>
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        emoji
        numberOfLines={1}
        style={[
          invalidHandle
            ? [
                a.border,
                a.text_xs,
                a.px_sm,
                a.py_xs,
                a.rounded_xs,
                {borderColor: t.palette.contrast_200},
              ]
            : [a.text_md, a.leading_snug, t.atoms.text_contrast_medium],
          web({wordBreak: 'break-all'}),
        ]}>
        {invalidHandle ? _(msg`⚠Invalid Handle`) : `@${profile.handle}`}
      </Text>

      {renderTruAnon()}
    </>
  )
}
