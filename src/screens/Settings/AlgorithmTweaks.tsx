import { Dimensions, StyleSheet, View } from "react-native";
import { Trans } from "@lingui/macro";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { CommonNavigatorParams } from "#/lib/routes/types";
import { List } from "#/view/com/util/List";
import * as Layout from '#/components/Layout'
import { Text } from "#/components/Typography";
import { Topic, Topics } from "../Feeds/Topics";

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AlgorithmTweaks'>

const { width } = Dimensions.get('window');

type InterestValues = {
  [key: string]: number
}

export function AlgorithmTweaksScreen({}: Props) {
  // const [interestValues, setInterestValues] = useState(
  //   Topics.reduce((acc, topic) => ({
  //     ...acc,
  //     [topic.id]: topic.value
  //   }), {} as InterestValues)
  // );

  const handleInterestChange = (id:string, value:number) => {
    // Update the local state for immediate UI feedback
    // setInterestValues(prev => ({
    //   ...prev,
    //   [id]: value
    // }));
    
    // // TODO: Implement actual functionality here
    // console.log(`Interest in ${id} changed to ${value}`);
  };

  const styles = StyleSheet.create({
    slider: {
      paddingVertical: 10,
      width: '95%',
    },
  })

  function TopicRenderer({ item }: { item: Topic }) {
    return (  
      <View>
        <Text style={{ paddingLeft: 18, fontSize: 18, fontWeight: 'bold' }}>{item .name}</Text>
      </View>
    )
  }

  return (
    <Layout.Screen testID="FeedsScreen">
      <Layout.Center>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Tweak My Algorithm</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
      </Layout.Center>
      <List data={Topics}
            renderItem={TopicRenderer}
            keyExtractor={(item) => item.id} />
    </Layout.Screen>
  )
};
