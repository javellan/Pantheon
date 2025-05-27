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
  truAnonDetails,
  userPrefs,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  disableTaps?: boolean
  truAnonData?: any
  truAnonDetails?: TruAnonDetails
  userPrefs?: {
    wants_verified?: number
    wants_personal?: number
    wants_social?: number
    wants_private?: number
  }
}) {
  const t = useTheme()
  const {_} = useLingui()
  const invalidHandle = isInvalidHandle(profile.handle)
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy

  const cleanPrefs = userPrefs
    ? {
        wants_verified: Number(userPrefs.wants_verified),
        wants_personal: Number(userPrefs.wants_personal),
        wants_social: Number(userPrefs.wants_social),
        wants_private: Number(userPrefs.wants_private),
      }
    : undefined

  const wants_private = !!cleanPrefs?.wants_private
  const wantsPersonal = !!cleanPrefs?.wants_personal
  const wantsSocial = !!cleanPrefs?.wants_social

  const dataPointsOfTypeKind = (
    type: string,
    kind?: string,
  ): {value: string; dataPointIconClass: string}[] => {
    if (!truAnonData?.dataConfigurations) return []
    return truAnonData.dataConfigurations
      .filter(
        d =>
          d.dataPointType === type &&
          (kind === undefined || d.dataPointKind === kind),
      )
      .map(d => ({
        value: d.displayValue,
        name: d.dataPointName,
        dataPointIconClass: d.dataPointIconClass || '',
      }))
      .filter(d => d.value)
  }

  const renderLine = (
    entries: {value: string; dataPointIconClass: string}[],
    keyPrefix: string,
  ) => {
    if (entries.length === 0) return null
    const values = entries.map(e => e.value).join(', ')
    const parts = entries[0].dataPointIconClass.split(' ')
    const name = parts.find(p => p.startsWith('fa-'))?.replace('fa-', '') || ''

    return (
      <Text
        key={keyPrefix}
        style={[
          a.text_sm,
          t.atoms.text_contrast_medium,
          {lineHeight: StyleSheet.flatten(a.text_sm).fontSize * 1.25},
        ]}>
        <FontAwesome5
          name={name as any}
          size={StyleSheet.flatten(a.text_sm).fontSize}
          color="#f4f4f4"
        />{' '}
        {values}
      </Text>
    )
  }

  const renderInlineSocial = (
    name: string,
    value: string,
    iconClass: string,
    key: string,
  ) => {
    const icon =
      iconClass
        ?.split(' ')
        .find(p => p.startsWith('fa-'))
        ?.replace('fa-', '') || 'question-circle'

    const Icon = (
      <FontAwesome5
        name={icon as any}
        size={StyleSheet.flatten(a.text_sm).fontSize}
        color={wants_private ? '#cfc9bb' : '#fff'}
      />
    )

    const TextContent = (
      <Text
        style={[
          a.text_sm,
          !wants_private && a.font_bold,
          t.atoms.text_contrast_medium,
        ]}>
        {Icon} {name}
      </Text>
    )

    const Container = wants_private ? View : TouchableOpacity

    return (
      <Container
        key={key}
        accessibilityRole={wants_private ? undefined : 'button'}
        onPress={
          wants_private ? undefined : () => Linking.openURL(`http://${value}`)
        }
        activeOpacity={wants_private ? undefined : 0.6}
        style={{marginRight: 12, marginBottom: 6}}>
        {TextContent}
      </Container>
    )
  }

  const renderTruAnon = () => {
    const rankColors: Record<string, string> = {
      Dangerous: '#e0245e',
      Cautioned: '#ffad1f',
      Credible: '#e0e0e0',
      Reliable: '#17bf63',
      Genuine: '#1d9bf0',
      Unknown: '#666',
    }

    const wantsVerify = userPrefs?.wants_verified === 1
    const hasTruAnon = truAnonData != null
    const shouldWaitForData = wantsVerify && !hasTruAnon

    if (userPrefs === undefined) return null
    console.log('userPrefs == ', userPrefs)
    if (shouldWaitForData) return null

    let authorRank = null

    if (wantsVerify) {
      if (truAnonData?.authorRank !== undefined) {
        authorRank = truAnonData.authorRank
      } else {
        // still loading — bail before render
        return null
      }
    } else {
      // not verifying — treat as implicitly "Unknown" for now
      authorRank = 'Unknown'
    }

    const isUnknown = authorRank === 'Unknown'
    const rankColor = rankColors[authorRank] || '#666'
    const showPrivate = wants_private && !isUnknown

    const badgePill = (
      <View
        style={[
          a.flex_row,
          a.align_center,
          {
            alignSelf: 'flex-start',
            borderColor: showPrivate ? '#cfc9bb' : rankColor,
            marginBottom: 12,
            borderWidth: 1,
            backgroundColor: showPrivate ? '#2c2c33' : '#000',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            gap: 8,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}>
        <Text style={[{color: rankColor}]}>
          <FontAwesome
            name="check-circle"
            size={StyleSheet.flatten(a.text_sm).fontSize * 2.25}
          />
        </Text>
        <View style={{flexShrink: 1, marginRight: 8}}>
          <Text style={[a.text_sm, {color: showPrivate ? '#cfc9bb' : '#fff'}]}>
            {authorRank}
          </Text>
          <Text
            style={[a.text_xs, {color: showPrivate ? '#cfc9bb' : '#ede8df'}]}>
            {isUnknown
              ? 'Ask Me To Verify Identity'
              : `${truAnonData?.authorRankScore ?? '–'} of 5`}
          </Text>
        </View>
      </View>
    )

    const birthdayData = dataPointsOfTypeKind('birthday', 'personal')
    const locationData = dataPointsOfTypeKind('location', 'personal')
    const genderData = dataPointsOfTypeKind('gender', 'personal')
    const socialData = truAnonDetails?.socials || []

    return (
      <View style={{marginTop: 8, marginBottom: 8}}>
        {truAnonData?.truAnonUrl && !showPrivate && !isUnknown ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.5}
            onPress={() => Linking.openURL(`https://${truAnonData.truAnonUrl}`)}
            style={{marginBottom: 2}}>
            {badgePill}
          </TouchableOpacity>
        ) : (
          badgePill
        )}

        {!isUnknown && (
          <View>
            {wantsPersonal && (
              <Text
                style={[
                  a.text_sm,
                  t.atoms.text_contrast_medium,
                  {marginTop: 8, marginBottom: 8},
                ]}>
                {renderLine(locationData, 'location')}
                {'   '}
                {renderLine(birthdayData, 'birthday')}
                {'   '}
                {renderLine(genderData, 'gender')}
              </Text>
            )}

            {wantsSocial && (
              <Text
                style={[
                  a.text_sm,
                  a.font_bold,
                  t.atoms.text_contrast_medium,
                  {
                    flexWrap: 'wrap',
                    marginTop: 12,
                    marginBottom: 0,
                  },
                ]}>
                {socialData.map((s, i) =>
                  renderInlineSocial(
                    s.dataPointName,
                    s.displayValue,
                    s.dataPointIconClass,
                    `social-${i}`,
                  ),
                )}
              </Text>
            )}
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
