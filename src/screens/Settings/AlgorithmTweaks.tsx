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
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AlgorithmTweaks'>
export function AlgorithmTweaksScreen({}: Props) {
  const agent = useAgent()
  const [interests, setInterests] = useState<Interest[]>([])
  const [isDirty, setIsDirty] = useState(false)

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
    saveButton: {
      backgroundColor: '#007BFF',
      borderRadius: 8,
      paddingVertical: 4,
      paddingHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      width: 70,
      position: 'absolute',
      left: -38,
      top: -18,
    },
    saveButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: '600',
    },
    pageTitleView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: 30,
    },
    interestsTitle: {
      paddingTop: 20,
      alignItems: 'center',
      justifyContent: 'center',
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
          <Layout.Header.SubtitleText>Back</Layout.Header.SubtitleText>
          <Layout.Header.Content>
            <View style={styles.pageTitleView}>
              <Layout.Header.TitleText style={styles.pageTitle}>
                <Trans>Feeds</Trans>
              </Layout.Header.TitleText>
            </View>
          </Layout.Header.Content>
          <Layout.Header.Slot>
            <Button
              label={'Save'}
              style={[styles.saveButton, isDirty ? {} : {opacity: 0.5}]}
              disabled={!isDirty}
              onPress={() => handleSave()}>
              <ButtonText style={styles.saveButtonText}>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </Layout.Header.Slot>
        </Layout.Header.Outer>
      </Layout.Center>
      <View style={{paddingHorizontal: 20}}>
        <View style={styles.interestsTitle}>
          <Text style={[a.font_bold, a.text_md, a.mb_md]}>
            <Trans>Your Interests</Trans>
          </Text>
        </View>
        <List
          data={interests}
          renderItem={InterestRenderer}
          keyExtractor={item => item.id}
          style={{marginBottom: 180}}
        />
      </View>
    </Layout.Screen>
  )
}
