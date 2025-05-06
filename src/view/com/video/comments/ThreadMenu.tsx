import {Pressable} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import * as Menu from '#/components/Menu'
import {Settings2Icon} from '#/components/tao-icons/Settings2'

export default function ThreadMenu({
  sortReplies,
  setSortReplies,
}: {
  sortReplies: string
  setSortReplies: (newValue: string) => void
}): React.ReactNode {
  const {_} = useLingui()
  const t = useTheme()
  const control = Menu.useMenuControl()
  return (
    <Menu.Root control={control}>
      <Menu.Trigger label={_(msg`Comment options`)}>
        {() => (
          <Pressable
            style={a.ml_sm}
            hitSlop={HITSLOP_10}
            onPress={() => control.open()}
            accessibilityLabel={_(msg`Comment Display Settings`)}
            accessibilityHint={_(msg`Tap to set comment display settings`)}>
            <Settings2Icon size="md" style={t.atoms.text_contrast_medium} />
          </Pressable>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Comment sorting</Trans>
        </Menu.LabelText>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Hot comments first`)}
            onPress={() => {
              setSortReplies('hotness')
            }}>
            <Menu.ItemText>
              <Trans>Hot comments first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'hotness'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Oldest comments first`)}
            onPress={() => {
              setSortReplies('oldest')
            }}>
            <Menu.ItemText>
              <Trans>Oldest comments first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'oldest'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Newest comments first`)}
            onPress={() => {
              setSortReplies('newest')
            }}>
            <Menu.ItemText>
              <Trans>Newest comments first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'newest'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Most-liked comments first`)}
            onPress={() => {
              setSortReplies('most-likes')
            }}>
            <Menu.ItemText>
              <Trans>Most-liked comments first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'most-likes'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Random (aka "Poster's Roulette")`)}
            onPress={() => {
              setSortReplies('random')
            }}>
            <Menu.ItemText>
              <Trans>Random (aka "Poster's Roulette")</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'random'} />
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
