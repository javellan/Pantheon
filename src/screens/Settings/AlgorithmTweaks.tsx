import {useEffect, useState} from 'react'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Trans} from '@lingui/macro'
import {Slider} from '@miblanchard/react-native-slider'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import debounce from 'lodash.debounce'

import {Interest} from '#/lib/api/feed/interests'
import {aggregateUserInterests, INTERESTS} from '#/lib/api/feed/utils'
import {usePalette} from '#/lib/hooks/usePalette'
import {InfoCircleIcon} from '#/lib/icons'
import {CommonNavigatorParams} from '#/lib/routes/types'
import * as persisted from '#/state/persisted'
import {useAgent} from '#/state/session'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AlgorithmTweaks'>
export function AlgorithmTweaksScreen({}: Props) {
  const agent = useAgent()
  const pal = usePalette('default')
  const [interests, setInterests] = useState<Interest[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const t = useTheme()

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const aggregated = aggregateUserInterests()
        setInterests(aggregated)
      } catch (e) {
        console.error('Failed to fetch user preferences', e)
      }
    }
    fetchPrefs()
  }, [agent])

  const debouncedInterestStateChange = React.useMemo(
    () =>
      debounce((id, value) => {
        setIsDirty(true)
        setInterests(prev =>
          prev.map(interest =>
            interest.id === id
              ? {...interest, value: Math.trunc(value)}
              : interest,
          ),
        )
      }, 200),
    [],
  )

  const handleInterestChange = (id: string, value: number) => {
    debouncedInterestStateChange(id, value)
  }

  const styles = StyleSheet.create({
    topicRenderer: {
      paddingBottom: 30,
    },
    topicTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    topicTitleInfoIcon: {
      width: 68,
      paddingLeft: 8,
    },
    sliderThumb: {
      width: 20,
      height: 60,
      backgroundColor: '#fff',
      boxShadow: 'rgba(0, 0, 0, 1) 0px 4px 4px',
    },
    sliderTrack: {
      height: 54,
      backgroundColor: '#f2f2f2',
      borderRadius: 10,
    },
    sliderContainer: {
      paddingVertical: 30,
    },
    sliderTrackMark: {
      width: 2,
      height: 15,
      backgroundColor: '#aaa',
      borderRadius: 5,
    },
  })

  function InterestRenderer({item}: {item: Interest}) {
    return (
      <View style={styles.topicRenderer}>
        <View style={styles.topicTitle}>
          <Text style={[a.font_heavy, a.text_lg]}>{item.name}</Text>
          <View style={styles.topicTitleInfoIcon}>
            <InfoCircleIcon size={20} style={pal.textLight} strokeWidth={1.5} />
          </View>
        </View>
        <Slider
          thumbTouchSize={{width: 20, height: 20}}
          thumbStyle={styles.sliderThumb}
          trackStyle={styles.sliderTrack}
          containerStyle={styles.sliderContainer}
          minimumTrackStyle={{backgroundColor: '#f2f2f2'}}
          minimumValue={1}
          maximumValue={10}
          trackMarks={[3, 5, 7]}
          renderTrackMarkComponent={({}) => (
            <View style={styles.sliderTrackMark} />
          )}
          value={item.value}
          onValueChange={value => handleInterestChange(item.id, value[0])}
        />
      </View>
    )
  }

  function handleSave() {
    // Only need to store the key and the tweak the user made to it
    const strippedInterests = interests.map(({id, value}) => ({id, value}))
    console.log('storing strippedInterests', strippedInterests)
    persisted.write(INTERESTS, strippedInterests)
    setIsDirty(false)
  }

  return (
    <Layout.Screen testID="FeedsScreen">
      <Layout.Center>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Back</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot>
            <Button
              label={'Save'}
              disabled={!isDirty}
              onPress={() => handleSave()}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </Layout.Header.Slot>
        </Layout.Header.Outer>
      </Layout.Center>
      <View style={{paddingHorizontal: 20}}>
        <Text style={[a.font_heavy, a.text_4xl]}>
          <Trans>Manage Topics</Trans>
        </Text>
        <Text
          style={[
            a.text_md,
            {paddingBottom: 20, color: t.palette.contrast_600},
          ]}>
          <Trans>
            Customize your feed to see more or less of the content you like.
          </Trans>
        </Text>
        <List
          data={interests}
          renderItem={InterestRenderer}
          keyExtractor={item => item.id}
          style={{marginBottom: 250}}
        />
      </View>
    </Layout.Screen>
  )
}
