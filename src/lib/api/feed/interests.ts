export type Interest = {
  id: string
  name: string
  description: string
  value: number
  uris: string[]
}

export const Interests: Interest[] = [
  {
    id: 'news',
    name: 'News',
    description:
      'Stay informed with the latest news and journalism from around the world.',
    value: 5,
    uris: ['cls-newsjournal'],
  },
  {
    id: 'journalism',
    name: 'Journalism',
    description:
      'Dive deep into investigative journalism and in-depth reporting.',
    value: 5,
    uris: ['cls-newsjournal'],
  },
  {
    id: 'nature',
    name: 'Nature',
    description:
      'Explore the beauty of nature and stay updated on climate and travel.',
    value: 5,
    uris: ['cls-traveladvv2', 'cls-climatenatu'],
  },
  {
    id: 'art',
    name: 'Art',
    description: 'Discover stunning art and photography from around the world.',
    value: 5,
    uris: ['cls-artphotov2'],
  },
  {
    id: 'comics',
    name: 'Comics',
    description: 'Enjoy a variety of comics and artistic photography.',
    value: 5,
    uris: ['cls-artphotocom'],
  },
  {
    id: 'writers',
    name: 'Writers',
    description: 'Get inspired by books and the works of talented writers.',
    value: 5,
    uris: ['cls-bookswriter'],
  },
  {
    id: 'culture',
    name: 'Culture',
    description: 'Immerse yourself in culture, travel, fashion, and art.',
    value: 5,
    uris: ['cls-traveladvv2', 'cls-fashionbeau', 'cls-artphotov2'],
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Stay updated with the latest sports news and events.',
    value: 5,
    uris: ['cls-sports'],
  },
  {
    id: 'pets',
    name: 'Pets',
    description: 'Find heartwarming stories and tips about pets and animals.',
    value: 5,
    uris: ['cls-petsanimals'],
  },
  {
    id: 'animals',
    name: 'Animals',
    description: 'Explore the fascinating world of animals and wildlife.',
    value: 5,
    uris: ['cls-petsanimals'],
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Discover new books and get recommendations from writers.',
    value: 5,
    uris: ['cls-bookswriter'],
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Stay informed on the latest in education and learning.',
    value: 5,
    uris: ['cls-education'],
  },
  {
    id: 'climate',
    name: 'Climate',
    description: 'Stay updated on climate change and environmental news.',
    value: 5,
    uris: ['cls-climatenatu'],
  },
  {
    id: 'science',
    name: 'Science',
    description:
      'Explore the latest discoveries and advancements in science and technology.',
    value: 5,
    uris: ['clsv-sciencetec'],
  },
  {
    id: 'politics',
    name: 'Politics',
    description: 'Stay informed on the latest political news and events.',
    value: 5,
    uris: ['cls-newspolitic'],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description:
      'Get tips on staying fit and healthy with exercise and nutrition advice.',
    value: 5,
    uris: ['cls-fithealthv2'],
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Discover the latest in technology and software developments.',
    value: 5,
    uris: ['clsv-sciencetec'],
  },
  {
    id: 'dev',
    name: 'Development',
    description:
      'Stay updated on the latest in software development and technology.',
    value: 5,
    uris: ['clsv-sciencetec'],
  },
  {
    id: 'comedy',
    name: 'Comedy',
    description: 'Enjoy a good laugh with the latest in comedy.',
    value: 5,
    uris: ['cls-comedy'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Stay updated on the latest in gaming news and trends.',
    value: 5,
    uris: ['cls-gaming'],
  },
  {
    id: 'food',
    name: 'Food',
    description: 'Discover delicious recipes and culinary tips.',
    value: 5,
    uris: ['cls-fooddrinkv2'],
  },
  {
    id: 'cooking',
    name: 'Cooking',
    description:
      'Find inspiration for your next meal with cooking tips and recipes.',
    value: 5,
    uris: ['cls-fooddrinkv2'],
  },
]
