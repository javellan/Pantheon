import {useCallback} from 'react'
import {Keyboard, Text} from 'react-native'
import {ImagePickerAsset, ImagePickerSuccessResult} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {SUPPORTED_MIME_TYPES, SupportedMimeTypes} from '#/lib/constants'
import {BSKY_SERVICE} from '#/lib/constants'
import {getHostnameFromUrl} from '#/lib/strings/url-helpers'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import * as Prompt from '#/components/Prompt'


const VIDEO_MAX_DURATION = 60 * 1000 // 60s in milliseconds


type Props = {
  onSelectVideo: (video: ImagePickerAsset) => void
  disabled?: boolean
  setError: (error: string) => void
  videoAsset: ImagePickerAsset | null
  result: ImagePickerSuccessResult | null
}

export function ConfirmVideoBtn({onSelectVideo, disabled, setError, videoAsset, result}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Prompt.usePromptControl()
  const {currentAccount} = useSession()

  const onPressSelectVideo = useCallback(async () => {
    if (
      currentAccount &&
      !currentAccount.emailConfirmed &&
      getHostnameFromUrl(currentAccount.service) ===
        getHostnameFromUrl(BSKY_SERVICE)
    ) {
      Keyboard.dismiss()
      control.open()
    } else {
        if (!result?.assets) {
            console.log("No video asset selected");
            setError("No video selected. Please record or pick a video.");
            return;
          }
    
      if (result?.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        console.log("This is their asset: ", asset)
        try {
          if (isWeb) {
            // asset.duration is null for gifs (see the TODO in pickVideo.web.ts)
            if (asset.duration && asset.duration > VIDEO_MAX_DURATION) {
              throw Error(_(msg`Videos must be less than 60 seconds long`))
            }
            // compression step on native converts to mp4, so no need to check there
            if (
              !SUPPORTED_MIME_TYPES.includes(
                asset.mimeType as SupportedMimeTypes,
              )
            ) {
              throw Error(_(msg`Unsupported video type: ${asset.mimeType}`))
            }
          } else {
            if (typeof asset.duration !== 'number') {
              throw Error('Asset is not a video')
            }
            if (asset.duration > VIDEO_MAX_DURATION) {
              throw Error(_(msg`Videos must be less than 60 seconds long`))
            }
          }
          onSelectVideo(asset)
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError(_(msg`An error occurred while selecting the video`))
          }
        }
      }
    }
  }, [
    currentAccount,
    control,
    setError,
    _,
    onSelectVideo,
  ])

  return (
    <>
      <Button
        testID="openGifBtn"
        onPress={onPressSelectVideo}
        label={_(msg`Select video`)}
        accessibilityHint={_(msg`Confirms video`)}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary"
        disabled={disabled}>
        <Text>
          Next
        </Text>
      </Button>
      <VerifyEmailPrompt control={control} />
    </>
  )
}

function VerifyEmailPrompt({control}: {control: Prompt.PromptControlProps}) {
  const {_} = useLingui()
  const verifyEmailDialogControl = useDialogControl()

  return (
    <>
      <Prompt.Basic
        control={control}
        title={_(msg`Verified email required`)}
        description={_(
          msg`To upload videos to Bluesky, you must first verify your email.`,
        )}
        confirmButtonCta={_(msg`Verify now`)}
        confirmButtonColor="primary"
        onConfirm={() => {
          verifyEmailDialogControl.open()
        }}
      />
      <VerifyEmailDialog control={verifyEmailDialogControl} />
    </>
  )
}
