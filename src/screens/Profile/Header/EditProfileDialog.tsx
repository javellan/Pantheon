import {useCallback, useEffect, useState} from 'react'
import {Dimensions, View} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {AppBskyActorDefs} from '@atproto/api'
import {TRUANON_AUTH_TOKEN} from '@env'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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

async function savePrefs(handle: string, prefs: any) {
  const url = `https://devhauz.truanon.com/api/prefs/${handle}`
  const TRUANON_AUTH_HEADER = `Bearer ${TRUANON_AUTH_TOKEN}`

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: TRUANON_AUTH_HEADER,
    },
    body: JSON.stringify(prefs),
  })
}

export function EditProfileDialog({
  profile,
  control,
  onClose,
  onUpdate,
  prefs,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  control: Dialog.DialogControlProps
  onClose?: () => void
  onUpdate?: () => void
  prefs?: {
    wants_verified?: number
    wants_personal?: number
    wants_social?: number
    wants_private?: number
  }
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

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventDismiss: dirty, minHeight: SCREEN_HEIGHT}}
      testID="editProfileModal">
      <DialogInner
        profile={profile}
        onUpdate={onUpdate}
        setDirty={setDirty}
        prefs={prefs}
      />
      <Prompt.Basic
        control={cancelControl}
        title={_(msg`Discard changes?`)}
        description={_(msg`Are you sure you want to discard your changes?`)}
        onConfirm={() => {
          control.close()
          onClose?.()
          onUpdate?.()
        }}
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
  prefs: initialPrefs,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  onUpdate?: () => void
  setDirty: (dirty: boolean) => void
  prefs?: {
    wants_verified?: number
    wants_personal?: number
    wants_social?: number
    wants_private?: number
  }
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()

  const {
    mutateAsync: updateProfileMutation,
    error: updateProfileError,
    isError: isUpdateProfileError,
  } = useProfileUpdateMutation()

  const [imageError, setImageError] = useState('')
  const [verifyUrl, setVerifyUrl] = useState<string | undefined>()
  const [assignedUrl, setAssignedUrl] = useState<string | undefined>()

  const [prefs, setPrefs] = useState(() => ({
    wants_verified: !!initialPrefs?.wants_verified,
    wants_personal: !!initialPrefs?.wants_personal,
    wants_social: !!initialPrefs?.wants_social,
    wants_private: !!initialPrefs?.wants_private,
  }))

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

  const fetchVerify = useCallback(async () => {
    const result = await getVerifyLink(profile.handle)

    setVerifyUrl(result?.verifyUrl)
    setAssignedUrl(result?.assignedUrl)

    const fetchedPrefs = result?.prefs
    if (fetchedPrefs) {
      setPrefs({
        wants_verified: !!fetchedPrefs.wants_verified,
        wants_personal: !!fetchedPrefs.wants_personal,
        wants_social: !!fetchedPrefs.wants_social,
        wants_private: !!fetchedPrefs.wants_private,
      })
      console.log('[TAO] Loaded prefs:', fetchedPrefs)
    }
  }, [profile.handle])

  useEffect(() => {
    fetchVerify()
  }, [fetchVerify])
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
      await savePrefs(profile.handle, {
        ...prefs,
        last_rank_color: '#1d9bf0',
        last_badge_icon: 'fa-star',
        wants_verified: prefs.wants_verified ? 1 : 0,
        wants_personal: prefs.wants_personal ? 1 : 0,
        wants_social: prefs.wants_social ? 1 : 0,
        wants_private: prefs.wants_private ? 1 : 0,
      })

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

      if (dirty) {
        Toast.show(_(msg({message: 'Profile updated', context: 'toast'})))
      }
    } catch (e) {
      logger.error('Failed to update user profile', {message: String(e)})
    }
  }, [
    profile,
    updateProfileMutation,
    displayName,
    description,
    newUserAvatar,
    newUserBanner,
    prefs,
    control,
    onUpdate,
    dirty,
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
          renderRight={() => (
            <Button
              label={_(msg`Done`)}
              onPress={onPressSave}
              size="small"
              color="primary"
              variant="ghost"
              style={[a.rounded_full]}>
              <ButtonText style={[a.text_md]}>
                <Trans>Done</Trans>
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
              prefs={prefs}
              setPrefs={setPrefs}
              onVerified={fetchVerify}
            />
          )}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
