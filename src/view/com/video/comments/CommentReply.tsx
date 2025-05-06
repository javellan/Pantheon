import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {
  Gesture,
  GestureDetector,
  NativeGesture,
  Pressable,
  TextInput,
} from 'react-native-gesture-handler'
import {
  KeyboardAvoidingView,
  KeyboardEvents,
} from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {s} from '#/lib/styles'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {UserAvatar} from '../../util/UserAvatar'
import {useFullHeight} from '../useFullHeight'
import {useComments} from './CommentsProvider'

export default memo(function CommentReply({
  scrollGesture,
}: {
  scrollGesture: NativeGesture
}) {
  const height = useFullHeight()
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})

  const {enableInput, replyTo, setReplyTo, isPublishing, doPostReply} =
    useComments()
  const placeholder = useMemo(
    () =>
      replyTo
        ? `Reply to ${sanitizeDisplayName(
            replyTo.author.displayName || replyTo.author.handle,
          )}`
        : 'Add a comment',
    [replyTo],
  )

  const replyGesture = useMemo(() => {
    return Gesture.Pan().blocksExternalGesture(scrollGesture)
  }, [scrollGesture])

  const keyboardShowing = useSharedValue(false)
  useEffect(() => {
    const s1 = KeyboardEvents.addListener('keyboardWillShow', () => {
      keyboardShowing.set(true)
    })
    const s2 = KeyboardEvents.addListener('keyboardWillHide', () => {
      keyboardShowing.set(false)
      setReplyTo(null)
    })
    return () => {
      s1.remove()
      s2.remove()
    }
  }, [keyboardShowing, setReplyTo])
  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(keyboardShowing.get() ? 0.25 : 0, {duration: 200}),
      pointerEvents: keyboardShowing.get() ? 'auto' : 'none',
    }
  })
  const inputStyle = useAnimatedStyle(() => {
    return {
      marginBottom: withTiming(
        (keyboardShowing.get() ? a.mb_5xl : a.mb_sm).marginBottom,
        {duration: 200},
      ),
    }
  })
  const sendButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: keyboardShowing.get() ? 0 : 50}],
    }
  })

  const [commentText, setCommentText] = useState('')
  const postComment = useCallback(async () => {
    if (commentText) {
      await doPostReply(commentText)
      setCommentText('')
    }
  }, [commentText, doPostReply, setCommentText])

  const inputRef = useRef<TextInput>(null)
  useEffect(() => {
    if (
      replyTo !== null &&
      !keyboardShowing.get() &&
      inputRef.current?.isFocused() !== true
    ) {
      inputRef.current?.focus()
    }
  }, [replyTo, keyboardShowing, inputRef])

  return (
    <View
      style={[
        {height},
        a.z_10,
        a.w_full,
        a.absolute,
        a.bottom_0,
        {pointerEvents: 'box-none'},
      ]}>
      <KeyboardAvoidingView
        behavior="translate-with-padding"
        style={[a.flex_1, a.justify_end, {pointerEvents: 'box-none'}]}>
        <GestureDetector gesture={replyGesture}>
          <Animated.View
            style={[a.flex_1, {backgroundColor: 'black'}, overlayStyle]}
          />
        </GestureDetector>
        <GestureDetector gesture={replyGesture}>
          <View
            style={[
              a.border_t,
              t.atoms.bg_contrast_25,
              t.atoms.border_contrast_high,
              a.justify_center,
              a.align_center,
              {minHeight: insets.bottom + 60},
            ]}>
            {!enableInput ? (
              <Text>Creator has limited comments</Text>
            ) : (
              <>
                <Animated.View
                  style={[
                    a.flex_row,
                    a.m_sm,
                    a.p_sm,
                    a.pr_md,
                    a.border,
                    t.atoms.border_contrast_high,
                    {borderRadius: 18},
                    a.align_stretch,
                    inputStyle,
                  ]}>
                  <UserAvatar
                    avatar={profile?.avatar}
                    size={26}
                    usePlainRNImage={true}
                    type="user"
                  />
                  <TextInput
                    accessibilityLabel={placeholder}
                    accessibilityHint={placeholder}
                    ref={inputRef}
                    style={[a.flex_1, a.ml_sm, t.atoms.text, {maxHeight: 96}]}
                    placeholder={placeholder}
                    placeholderTextColor={t.atoms.text_contrast_low.color}
                    multiline
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                </Animated.View>
                <Animated.View
                  style={[
                    a.absolute,
                    a.bottom_0,
                    a.right_0,
                    a.m_sm,
                    sendButtonStyle,
                  ]}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={postComment}
                    disabled={isPublishing || !commentText}>
                    <Text
                      style={[
                        a.rounded_full,
                        {backgroundColor: s.brandBlue.color},
                        a.px_sm,
                        a.py_xs,
                        a.font_bold,
                      ]}>
                      Send{isPublishing ? 'ing...' : ''}
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </View>
  )
})
