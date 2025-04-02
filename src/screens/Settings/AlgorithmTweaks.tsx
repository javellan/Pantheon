import {useEffect, useRef,useState} from 'react'
import React from 'react'
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {FlatList} from 'react-native-gesture-handler'
import {t, Trans} from '@lingui/macro'
import {Slider} from '@miblanchard/react-native-slider'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import debounce from 'lodash.debounce'

import {Interest} from '#/lib/api/feed/interests'
import {
  defaultFeedPreferences,
  FeedPreferences,
  FeedType,
} from '#/lib/api/feed/preferences'
import {aggregateFeedPreferences, FEED_PREFERENCES} from '#/lib/api/feed/utils'
import {CommonNavigatorParams} from '#/lib/routes/types'
import * as persisted from '#/state/persisted'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {SearchInput} from '#/components/forms/SearchInput'
import {Heart2_Filled_Stroke2_Corner0_Rounded} from '#/components/icons/Heart2'
import {Trending2_Stroke2_Corner2_Rounded} from '#/components/icons/Trending2'
import {UserCircle_Filled_Corner0_Rounded} from '#/components/icons/UserCircle'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {InterestFinder} from './components/InterestFinder'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AlgorithmTweaks'>
export function AlgorithmTweaksScreen({}: Props) {
  const [feedPreferences, setFeedPreferences] = useState<FeedPreferences>(
    defaultFeedPreferences,
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const interestDrawerSlideUp = useRef(new Animated.Value(0)).current
  const searchInputRef = useRef<TextInput>(null)

  const theme = useTheme()
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const prefs = aggregateFeedPreferences()
        setFeedPreferences(prefs)
      } catch (e) {
        console.error('Failed to fetch user preferences', e)
      }
    }
    fetchPrefs()
  }, [])

  const debouncedInterestStateChange = React.useMemo(
    () =>
      debounce((id, value) => {
        setIsDirty(true)
        setFeedPreferences(prev => {
          return {
            ...prev,
            interests: prev.interests.map(interest =>
              interest.id === id
                ? {...interest, value: Math.trunc(value)}
                : interest,
            ),
          }
        })
      }, 200),
    [],
  )

  const debouncedFeedPreferenceChange = React.useMemo(
    () =>
      debounce((key, value) => {
        setIsDirty(true)
        setFeedPreferences(prev => {
          return {
            ...prev,
            feedTypes: prev.feedTypes.map(feedType =>
              feedType.id === key
                ? {...feedType, weight: Math.trunc(value)}
                : feedType,
            ),
          }
        })
      }, 200),
    [],
  )

  const handleInterestChange = (id: string, value: number) => {
    debouncedInterestStateChange(id, value)
  }

  const styles = StyleSheet.create({
    feedTypeRenderer: {
      paddingVertical: 18,
    },
    feedTypeTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    feedTypeTitleText: {
      flex: 0,
      width: 100,
      paddingLeft: 8,
      fontSize: 16,
      fontWeight: '600',
    },

    topicRenderer: {},
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
    feedTypeSliderContainer: {},
    interestSliderContainer: {},
    saveButton: {
      backgroundColor: '#007BFF',
      borderRadius: 8,
      paddingVertical: 2,
      paddingHorizontal: 2,
      shadowColor: '#000',
      width: 70,
      position: 'absolute',
      left: -38,
      top: -13,
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

  const feedTypeIcons = {
    trending: Trending2_Stroke2_Corner2_Rounded,
    following: UserCircle_Filled_Corner0_Rounded,
    interests: Heart2_Filled_Stroke2_Corner0_Rounded,
  }

  function FeedTypeRenderer({item}: {item: FeedType}) {
    const Icon = feedTypeIcons[item.id]
    return (
      <View style={styles.feedTypeRenderer}>
        <View style={styles.feedTypeTitle}>
          {Icon && <Icon style={{color: theme.palette.contrast_975}} />}
          <Text style={[a.font_heavy, a.text_lg, styles.feedTypeTitleText]}>
            {item.label}
          </Text>
        </View>
        <View style={styles.sliderView}>
          <Slider
            thumbTouchSize={{width: 20, height: 20}}
            thumbStyle={styles.sliderThumb}
            trackStyle={styles.sliderTrack}
            containerStyle={styles.feedTypeSliderContainer}
            minimumTrackStyle={styles.sliderMinimumTrack}
            minimumValue={1}
            maximumValue={10}
            value={item.weight}
            step={1}
            onValueChange={value =>
              debouncedFeedPreferenceChange(item.id, value[0])
            }
          />
        </View>
      </View>
    )
  }

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
              containerStyle={styles.interestSliderContainer}
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
    const strippedInterests = feedPreferences.interests
      .filter(interest => interest.selected)
      .map(({id, value, selected}) => ({id, value, selected}))
    persisted.write(FEED_PREFERENCES, {
      ...feedPreferences,
      interests: strippedInterests,
    })
    setIsDirty(false)
  }

  function interestSelected(interest: Interest): void {
    setFeedPreferences(prev => {
      return {
        ...prev,
        interests: prev.interests.map(i =>
          i.id === interest.id ? {...i, selected: true} : i,
        ),
      }
    })
    setIsDirty(true)
  }

  function interestDeselected(interest: Interest): void {
    setFeedPreferences(prev => {
      return {
        ...prev,
        interests: prev.interests.map(i =>
          i.id === interest.id ? {...i, selected: false} : i,
        ),
      }
    })
    setIsDirty(true)
  }

  const onAddInterestFocus = () => {
    setIsModalVisible(true)

    Animated.timing(interestDrawerSlideUp, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      searchInputRef.current?.focus()
    })
  }

  const closeModal = () => {
    Animated.timing(interestDrawerSlideUp, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setIsModalVisible(false)
    })
  }

  const slideUpStyle = {
    transform: [
      {
        translateY: interestDrawerSlideUp.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0], // Slide from off-screen (500px) to on-screen (0px)
        }),
      },
    ],
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
      <View style={{paddingHorizontal: 20, opacity: isModalVisible ? 0 : 1}}>
        <List
          data={feedPreferences.feedTypes}
          renderItem={FeedTypeRenderer}
          scrollEnabled={false}
          keyExtractor={item => item.id}
        />
        <View style={styles.interestsTitle}>
          <Text style={[a.font_bold, a.text_md, a.mb_md]}>
            <Trans>Your Interests</Trans>
          </Text>
        </View>
        <TouchableOpacity accessibilityRole="button" activeOpacity={1} onPress={onAddInterestFocus}>
          <SearchInput
            placeholder={t`Add interest`}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <FlatList
          data={feedPreferences.interests.filter(interest => interest.selected)}
          renderItem={InterestRenderer}
          keyExtractor={item => item.id}
          style={{height: 340}}
        />
      </View>

      {/* Modal for InterestFinder */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}>
        <TouchableWithoutFeedback accessibilityRole="button" onPress={closeModal}>
          <View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)'}} />
        </TouchableWithoutFeedback>
        <View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.atoms.bg.backgroundColor,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 20,
              },
              slideUpStyle,
            ]}>
            <InterestFinder
              interests={feedPreferences.interests}
              onInterestSelected={interestSelected}
              onInterestDeselected={interestDeselected}
              searchInputRef={searchInputRef}
            />
          </Animated.View>
        </View>
      </Modal>
    </Layout.Screen>
  )
}
