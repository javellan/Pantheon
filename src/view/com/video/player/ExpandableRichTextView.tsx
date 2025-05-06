import {useEffect, useState} from 'react'
import {LayoutAnimation, Pressable, ScrollView} from 'react-native'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {RichText as RichTextAPI} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_20} from '#/lib/constants'
import {useA11y} from '#/state/a11y'
import {atoms as a} from '#/alf'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

export function ExpandableRichTextView({
  value,
  authorHandle,
  onChangeExpand,
}: {
  value: RichTextAPI
  authorHandle?: string
  onChangeExpand?: (isExpanded: boolean) => void
}) {
  const {height: screenHeight} = useSafeAreaFrame()
  const [expanded, setExpanded] = useState(false)
  const [hasBeenExpanded, setHasBeenExpanded] = useState(false)
  const [constrained, setConstrained] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const {_} = useLingui()
  const {screenReaderEnabled} = useA11y()

  if (expanded && !hasBeenExpanded) {
    setHasBeenExpanded(true)
  }

  useEffect(() => {
    if (onChangeExpand) {
      onChangeExpand(expanded)
    }
  }, [expanded, onChangeExpand])

  return (
    <ScrollView
      scrollEnabled={expanded}
      onContentSizeChange={(_w, h) => {
        if (hasBeenExpanded) {
          LayoutAnimation.configureNext({
            duration: 500,
            update: {type: 'spring', springDamping: 0.6},
          })
        }
        setContentHeight(h)
      }}
      style={{
        height: Math.min(contentHeight, screenHeight * 0.5),
        flexGrow: 0,
      }}
      contentContainerStyle={[
        a.py_sm,
        a.gap_xs,
        expanded ? [a.align_start] : a.flex_row,
      ]}>
      <RichText
        value={value}
        style={[
          a.text_sm,
          a.flex_1,
          a.leading_normal,
          a.text_shadow_dark,
          {paddingRight: 40},
        ]}
        authorHandle={authorHandle}
        enableTags
        numberOfLines={
          expanded || screenReaderEnabled ? undefined : constrained ? 2 : 2
        }
        onTextLayout={evt => {
          if (!constrained && evt.nativeEvent.lines.length > 1) {
            setConstrained(true)
          }
        }}
      />
      {constrained && !screenReaderEnabled && (
        <Pressable
          accessibilityHint={_(msg`Tap to expand or collapse post text.`)}
          accessibilityLabel={expanded ? _(msg`Read less`) : _(msg`Read more`)}
          hitSlop={HITSLOP_20}
          onPress={() => setExpanded(prev => !prev)}
          style={[a.absolute, {bottom: 8, right: 0}]}>
          <Text style={[a.font_bold]}>{expanded ? 'hide' : 'more'}</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}
