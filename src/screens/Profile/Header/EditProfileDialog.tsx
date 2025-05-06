import {useCallback, useEffect, useState} from 'react'
import {Dimensions, View} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {compressIfNeeded} from '#/lib/media/manip'
import {cleanError} from '#/lib/strings/errors'
import {useWarnMaxGraphemeCount} from '#/lib/strings/helpers'
import {getVerifyLink} from '#/lib/truanon/useTruAnonProfile'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useProfileUpdateMutation} from '#/state/queries/profile'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {EditableUserAvatar} from '#/view/com/util/UserAvatar'
import {UserBanner} from '#/view/com/util/UserBanner'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Prompt from '#/components/Prompt'
import {TruAnonVerificationSwitch} from '#/components/truanon/TruAnonVerificationSwitch'

const DISPLAY_NAME_MAX_GRAPHEMES = 64
const DESCRIPTION_MAX_GRAPHEMES = 256
const SCREEN_HEIGHT = Dimensions.get('window').height

export function EditProfileDialog({
  profile,
  control,
  onUpdate,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  control: Dialog.DialogControlProps
  onUpdate?: () => void
}) {
  const {_} = useLingui()
  const cancelControl = Dialog.useDialogControl()
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (isWeb && dirty) {
      const abortController = new AbortController()
      const {signal} = abortController
      window.addEventListener('beforeunload', evt => evt.preventDefault(), {
        signal,
      })
      return () => abortController.abort()
    }
  }, [dirty])

  const onPressCancel = useCallback(() => {
    if (dirty) {
      cancelControl.open()
    } else {
      control.close()
    }
  }, [dirty, control, cancelControl])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventDismiss: dirty, minHeight: SCREEN_HEIGHT}}
      testID="editProfileModal">
      <DialogInner
        profile={profile}
        onUpdate={onUpdate}
        setDirty={setDirty}
        onPressCancel={onPressCancel}
      />
      <Prompt.Basic
        control={cancelControl}
        title={_(msg`Discard changes?`)}
        description={_(msg`Are you sure you want to discard your changes?`)}
        onConfirm={() => control.close()}
        confirmButtonCta={_(msg`Discard`)}
        confirmButtonColor="negative"
      />
    </Dialog.Outer>
  )
}

function DialogInner({
  profile,
  onUpdate,
  setDirty,
  onPressCancel,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  onUpdate?: () => void
  setDirty: (dirty: boolean) => void
  onPressCancel: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()

  const {
    mutateAsync: updateProfileMutation,
    error: updateProfileError,
    isError: isUpdateProfileError,
    isPending: isUpdatingProfile,
  } = useProfileUpdateMutation()

  const [imageError, setImageError] = useState('')
  const [verifyUrl, setVerifyUrl] = useState<string | undefined>()
  const [assignedUrl, setAssignedUrl] = useState<string | undefined>()
  const [truAnonDetails, setTruAnonDetails] = useState<any>()

  const initialDisplayName = profile.displayName || ''
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const initialDescription = profile.description || ''
  const [description, setDescription] = useState(initialDescription)
  const [userBanner, setUserBanner] = useState(profile.banner)
  const [userAvatar, setUserAvatar] = useState(profile.avatar)
  const [newUserBanner, setNewUserBanner] = useState<
    RNImage | null | undefined
  >()
  const [newUserAvatar, setNewUserAvatar] = useState<
    RNImage | null | undefined
  >()

  const dirty =
    displayName !== initialDisplayName ||
    description !== initialDescription ||
    userAvatar !== profile.avatar ||
    userBanner !== profile.banner

  useEffect(() => setDirty(dirty), [dirty, setDirty])

  useEffect(() => {
    const fetchVerify = async () => {
      const result = await getVerifyLink(profile.handle)
      // console.log('[TruAnon] Verification fetch result:', result)
      setVerifyUrl(result?.verifyUrl)
      setAssignedUrl(result?.assignedUrl)
      setTruAnonDetails(result?.truAnonDetails)
    }
    fetchVerify()
  }, [profile.handle])

  // console.log('verifyUrl:', verifyUrl)
  // console.log('assignedUrl:', assignedUrl)
  // console.log('truAnonDetails:', truAnonDetails)

  const onSelectNewAvatar = useCallback(async (img: RNImage | null) => {
    setImageError('')
    if (img === null) {
      setUserAvatar(null)
      setNewUserAvatar(null)
      return
    }
    try {
      const finalImg = await compressIfNeeded(img, 1000000)
      setNewUserAvatar(finalImg)
      setUserAvatar(finalImg.path)
    } catch (e) {
      setImageError(cleanError(e))
    }
  }, [])

  const onSelectNewBanner = useCallback(async (img: RNImage | null) => {
    setImageError('')
    if (!img) {
      setUserBanner(null)
      setNewUserBanner(null)
      return
    }
    try {
      const finalImg = await compressIfNeeded(img, 1000000)
      setNewUserBanner(finalImg)
      setUserBanner(finalImg.path)
    } catch (e) {
      setImageError(cleanError(e))
    }
  }, [])

  const onPressSave = useCallback(async () => {
    setImageError('')
    try {
      await updateProfileMutation({
        profile,
        updates: {
          displayName: displayName.trimEnd(),
          description: description.trimEnd(),
        },
        newUserAvatar,
        newUserBanner,
      })
      onUpdate?.()
      control.close()
      Toast.show(_(msg({message: 'Profile updated', context: 'toast'})))
    } catch (e) {
      logger.error('Failed to update user profile', {message: String(e)})
    }
  }, [
    updateProfileMutation,
    profile,
    onUpdate,
    control,
    displayName,
    description,
    newUserAvatar,
    newUserBanner,
    setImageError,
    _,
  ])

  const displayNameTooLong = useWarnMaxGraphemeCount({
    text: displayName,
    maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
  })
  const descriptionTooLong = useWarnMaxGraphemeCount({
    text: description,
    maxCount: DESCRIPTION_MAX_GRAPHEMES,
  })

  return (
    <Dialog.ScrollableInner
      label={_(msg`Edit profile`)}
      style={[a.overflow_hidden]}
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <Dialog.Header
          renderLeft={() => (
            <Button
              label={_(msg`Cancel`)}
              onPress={onPressCancel}
              size="small"
              color="primary"
              variant="ghost"
              style={[a.rounded_full]}>
              <ButtonText style={[a.text_md]}>
                <Trans>Cancel</Trans>
              </ButtonText>
            </Button>
          )}
          renderRight={() => (
            <Button
              label={_(msg`Save`)}
              onPress={onPressSave}
              disabled={
                !dirty ||
                isUpdatingProfile ||
                displayNameTooLong ||
                descriptionTooLong
              }
              size="small"
              color="primary"
              variant="ghost"
              style={[a.rounded_full]}>
              <ButtonText
                style={[a.text_md, !dirty && t.atoms.text_contrast_low]}>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          )}>
          <Dialog.HeaderText>
            <Trans>Edit profile</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }>
      <View style={[a.relative]}>
        <UserBanner banner={userBanner} onSelectNewBanner={onSelectNewBanner} />
        <View
          style={[
            a.absolute,
            {
              top: 80,
              left: 20,
              width: 84,
              height: 84,
              borderWidth: 2,
              borderRadius: 42,
              borderColor: t.atoms.bg.backgroundColor,
            },
          ]}>
          <EditableUserAvatar
            size={80}
            avatar={userAvatar}
            onSelectNewAvatar={onSelectNewAvatar}
          />
        </View>
      </View>

      {isUpdateProfileError && (
        <View style={[a.mt_xl]}>
          <ErrorMessage message={cleanError(updateProfileError)} />
        </View>
      )}
      {imageError !== '' && (
        <View style={[a.mt_xl]}>
          <ErrorMessage message={imageError} />
        </View>
      )}

      <View style={[a.mt_4xl, a.px_xl, a.gap_xl]}>
        <View>
          <TextField.LabelText>
            <Trans>Display name</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={displayNameTooLong}>
            <Dialog.Input
              defaultValue={displayName}
              onChangeText={setDisplayName}
              label={_(msg`Display name`)}
              placeholder={_(msg`e.g. Alice Lastname`)}
              testID="editProfileDisplayNameInput"
            />
          </TextField.Root>
        </View>

        <View>
          <TextField.LabelText>
            <Trans>Description</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={descriptionTooLong}>
            <Dialog.Input
              defaultValue={description}
              onChangeText={setDescription}
              multiline
              label={_(msg`Description`)}
              placeholder={_(msg`Tell us a bit about yourself`)}
              testID="editProfileDescriptionInput"
            />
          </TextField.Root>
        </View>

        <View style={[a.gap_md]}>
          <TextField.LabelText>
            <Trans>Verified identity</Trans>
          </TextField.LabelText>
          {(assignedUrl || verifyUrl) && (
            <TruAnonVerificationSwitch
              verifyUrl={verifyUrl}
              assignedUrl={assignedUrl}
              truAnonDetails={truAnonDetails}
            />
          )}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
