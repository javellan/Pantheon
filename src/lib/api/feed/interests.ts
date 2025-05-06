import {PathProps} from 'react-native-svg'

import {gradients} from '#/alf/tokens'
import {TextProps} from '#/alf/typography'
import {Camera_Stroke2_Corner0_Rounded} from '#/components/icons/Camera'
import {sizes} from '#/components/icons/common'
import {Eye_Stroke2_Corner0_Rounded} from '#/components/icons/Eye'
import {Lab_Stroke2_Corner0_Rounded} from '#/components/icons/Lab'
import {Leaf_Stroke2_Corner0_Rounded} from '#/components/icons/Leaf'
import {Newspaper_Stroke2_Corner2_Rounded} from '#/components/icons/Newspaper'
import {PencilLine_Stroke2_Corner2_Rounded} from '#/components/icons/Pencil'
import {StreamingLive_Stroke2_Corner0_Rounded} from '#/components/icons/StreamingLive'
import {Trending2_Stroke2_Corner2_Rounded} from '#/components/icons/Trending2'

export type Interest = {
  id: string
  name: string
  description: string
  value: number
  uris: string[]
  selected: boolean
  icon: React.ForwardRefExoticComponent<{
    fill?: PathProps['fill']
    style?: TextProps['style']
    size?: keyof typeof sizes
    gradient?: keyof typeof gradients
    shadow?: string
  }>
}

const defaultInterestValue = 5
export const defaultInterests: Interest[] = [
  {
    id: 'news',
    name: 'News',
    description:
      'Stay informed with the latest news and journalism from around the world.',
    value: defaultInterestValue,
    uris: ['cls-newsjournal'],
    selected: false,
    icon: Newspaper_Stroke2_Corner2_Rounded,
  },
  {
    id: 'journalism',
    name: 'Journalism',
    description:
      'Dive deep into investigative journalism and in-depth reporting.',
    value: defaultInterestValue,
    uris: ['cls-newsjournal'],
    selected: false,
    icon: Camera_Stroke2_Corner0_Rounded,
  },
  {
    id: 'nature',
    name: 'Nature',
    description:
      'Explore the beauty of nature and stay updated on climate and travel.',
    value: defaultInterestValue,
    uris: ['cls-traveladvv2', 'cls-climatenatu'],
    selected: false,
    icon: Leaf_Stroke2_Corner0_Rounded,
  },
  {
    id: 'art',
    name: 'Art',
    description: 'Discover stunning art and photography from around the world.',
    value: defaultInterestValue,
    uris: ['cls-artphotov2'],
    selected: false,
    icon: Eye_Stroke2_Corner0_Rounded,
  },
  {
    id: 'comics',
    name: 'Comics',
    description: 'Enjoy a variety of comics and artistic photography.',
    value: defaultInterestValue,
    uris: ['cls-artphotocom'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'writers',
    name: 'Writers',
    description: 'Get inspired by books and the works of talented writers.',
    value: defaultInterestValue,
    uris: ['cls-bookswriter'],
    selected: false,
    icon: PencilLine_Stroke2_Corner2_Rounded,
  },
  {
    id: 'culture',
    name: 'Culture',
    description: 'Immerse yourself in culture, travel, fashion, and art.',
    value: defaultInterestValue,
    uris: ['cls-traveladvv2', 'cls-fashionbeau', 'cls-artphotov2'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Stay updated with the latest sports news and events.',
    value: defaultInterestValue,
    uris: ['cls-sports'],
    selected: false,
    icon: StreamingLive_Stroke2_Corner0_Rounded,
  },
  {
    id: 'pets',
    name: 'Pets',
    description: 'Find heartwarming stories and tips about pets and animals.',
    value: defaultInterestValue,
    uris: ['cls-petsanimals'],
    selected: false,
    icon: Lab_Stroke2_Corner0_Rounded,
  },
  {
    id: 'animals',
    name: 'Animals',
    description: 'Explore the fascinating world of animals and wildlife.',
    value: defaultInterestValue,
    uris: ['cls-petsanimals'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Discover new books and get recommendations from writers.',
    value: defaultInterestValue,
    uris: ['cls-bookswriter'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Stay informed on the latest in education and learning.',
    value: defaultInterestValue,
    uris: ['cls-education'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'climate',
    name: 'Climate',
    description: 'Stay updated on climate change and environmental news.',
    value: defaultInterestValue,
    uris: ['cls-climatenatu'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'science',
    name: 'Science',
    description:
      'Explore the latest discoveries and advancements in science and technology.',
    value: defaultInterestValue,
    uris: ['clsv-sciencetec'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'politics',
    name: 'Politics',
    description: 'Stay informed on the latest political news and events.',
    value: defaultInterestValue,
    uris: ['cls-newspolitic'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description:
      'Get tips on staying fit and healthy with exercise and nutrition advice.',
    value: defaultInterestValue,
    uris: ['cls-fithealthv2'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Discover the latest in technology and software developments.',
    value: defaultInterestValue,
    uris: ['clsv-sciencetec'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'dev',
    name: 'Development',
    description:
      'Stay updated on the latest in software development and technology.',
    value: defaultInterestValue,
    uris: ['clsv-sciencetec'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'comedy',
    name: 'Comedy',
    description: 'Enjoy a good laugh with the latest in comedy.',
    value: defaultInterestValue,
    uris: ['cls-comedy'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Stay updated on the latest in gaming news and trends.',
    value: defaultInterestValue,
    uris: ['cls-gaming'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'food',
    name: 'Food',
    description: 'Discover delicious recipes and culinary tips.',
    value: defaultInterestValue,
    uris: ['cls-fooddrinkv2'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
  {
    id: 'cooking',
    name: 'Cooking',
    description:
      'Find inspiration for your next meal with cooking tips and recipes.',
    value: defaultInterestValue,
    uris: ['cls-fooddrinkv2'],
    selected: false,
    icon: Trending2_Stroke2_Corner2_Rounded,
  },
]
