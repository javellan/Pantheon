import {useEffect, useState} from 'react'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Trans} from '@lingui/macro'
import {Slider} from '@miblanchard/react-native-slider'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import debounce from 'lodash.debounce'

import {Interest} from '#/lib/api/feed/interests'
import {aggregateUserInterests, INTERESTS} from '#/lib/api/feed/utils'
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
      paddingBottom: 0,
    },
    topicTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    topicTitleText: {
      flex: 0,
      width: 100,
      fontSize: 16,
      fontWeight: '600',
    },
    sliderView: {
      flex: 1,
      marginLeft: 10,
    },
    sliderThumb: {
      width: 16,
      height: 16,
      backgroundColor: 'rgba(46, 146, 252, 1)',
      boxShadow: 'rgba(0, 0, 0, 1) 0px 4px 4px',
    },
    sliderMinimumTrack: {
      backgroundColor: 'rgba(46, 146, 252, 1)',
    },
    sliderTrack: {
      height: 3,
      backgroundColor: '#FFF',
      borderRadius: 10,
    },
    sliderContainer: {
      paddingVertical: 0,
    },
  })

  function InterestRenderer({item}: {item: Interest}) {
    return (
      <View style={styles.topicRenderer}>
        <View style={styles.topicTitle}>
          <Text style={[a.font_heavy, a.text_lg, styles.topicTitleText]}>
            {item.name}
          </Text>
          <View style={styles.sliderView}>
            <Slider
              thumbTouchSize={{width: 20, height: 20}}
              thumbStyle={styles.sliderThumb}
              trackStyle={styles.sliderTrack}
              containerStyle={styles.sliderContainer}
              minimumTrackStyle={styles.sliderMinimumTrack}
              minimumValue={1}
              maximumValue={10}
              value={item.value}
              step={1}
              onValueChange={value => handleInterestChange(item.id, value[0])}
            />
          </View>
        </View>
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
