import {useState} from 'react'
import {
  Dimensions,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputChangeEventData,
  TextInputFocusEventData,
  TouchableOpacity,
  View,
} from 'react-native'
import {FlatList} from 'react-native-gesture-handler'
import {t} from '@lingui/macro'

import {Interest} from '#/lib/api/feed/interests'
import {Divider} from '#/components/Divider'
import * as FeedCard from '#/components/FeedCard'
import {SearchInput} from '#/components/forms/SearchInput'
import {PlusLarge_Stroke2_Corner0_Rounded} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded} from '#/components/icons/Trash'

type InterestFinderProps = {
  onInterestSelected: (interest: Interest) => void
  onInterestDeselected: (interest: Interest) => void
  interests: Interest[]
  searchInputRef: React.RefObject<TextInput>
}

export function InterestFinder({
  interests,
  onInterestSelected,
  onInterestDeselected,
  searchInputRef,
}: InterestFinderProps) {
  const [filteredInterests, setFilteredInterests] = useState<Interest[]>([])

  const onInterestSearchInputFocus = (
    event: NativeSyntheticEvent<TextInputFocusEventData>,
  ) => {
    filterUnusedInterests(event.nativeEvent.text || '')
  }

  const onInterestSearchInputChange = (
    event: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    filterUnusedInterests(event.nativeEvent.text || '')
  }

  function filterUnusedInterests(filterText: string) {
    const filtered =
      filterText.length === 0
        ? interests
        : interests.filter(interest =>
            interest.name.toLowerCase().includes(filterText.toLowerCase()),
          )
    setFilteredInterests(filtered)
  }

  const interestStyles = StyleSheet.create({
    container: {
      paddingVertical: 4,
      width: '100%',
    },
    icon: {
      paddingTop: 10,
      height: 40,
      width: 40,
    },
    title: {},
    description: {
      flex: 1,
      width: '100%',
    },
  })

  function interestRenderer({item: interest}: {item: Interest}) {
    const Icon = interest.icon
    return (
      <View style={interestStyles.container}>
        <View style={{flexDirection: 'row'}}>
          <View style={interestStyles.icon}>{Icon && <Icon size="2xl" />}</View>
          <View style={{flex: 1}}>
            <FeedCard.TitleAndByline title={interest.name} />
            <FeedCard.Description
              description={interest.description}
              style={interestStyles.description}
            />
          </View>
          <View style={{flexShrink: 0, paddingTop: 14}}>
            {interest.selected ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setFilteredInterests(
                    filteredInterests.map(i => {
                      return i.id === interest.id ? {...i, selected: false} : i
                    }),
                  )
                  onInterestDeselected(interest)
                }}>
                <Trash_Stroke2_Corner0_Rounded width={24} height={24} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setFilteredInterests(
                    filteredInterests.map(i => {
                      return i.id === interest.id ? {...i, selected: true} : i
                    }),
                  )
                  onInterestSelected(interest)
                }}>
                <PlusLarge_Stroke2_Corner0_Rounded width={24} height={24} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Divider style={{marginTop: 12}} />
      </View>
    )
  }
  const dimensions = Dimensions.get('window')
  return (
    <View style={{flexGrow: 1}}>
      <SearchInput
        placeholder={t`Add interest`}
        onChange={onInterestSearchInputChange}
        onFocus={onInterestSearchInputFocus}
        clearButtonMode="while-editing"
        ref={searchInputRef}
      />
      <FlatList
        data={filteredInterests}
        renderItem={interestRenderer}
        keyExtractor={item => item.id}
        style={{height: dimensions.height - 200, paddingTop: 10}}
      />
    </View>
  )
}
