import {defaultInterests,Interest} from './interests'

export type FeedType = {
  id: 'trending' | 'following' | 'interests'
  label: string
  description: string
  weight: number
}

export type FeedPreferences = {
  feedTypes: FeedType[]
  interests: Interest[]
}

export const defaultFeedPreferences: FeedPreferences = {
  feedTypes: [
    {
      id: 'trending',
      label: 'Trending',
      description: 'Trending posts from the community',
      weight: 5,
    },
    {
      id: 'following',
      label: 'Following',
      description: 'Posts from people you follow',
      weight: 5,
    },
    {
      id: 'interests',
      label: 'Interests',
      description: 'Posts based on your interests',
      weight: 5,
    },
  ],
  interests: defaultInterests,
}
