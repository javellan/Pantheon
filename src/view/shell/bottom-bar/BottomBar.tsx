import React, {ComponentProps} from 'react'
import {GestureResponderEvent, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {StackActions} from '@react-navigation/native'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {useDedupe} from '#/lib/hooks/useDedupe'
import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {usePalette} from '#/lib/hooks/usePalette'
import {clamp} from '#/lib/numbers'
import {getTabState, isStateAtTabRoot, TabState} from '#/lib/routes/helpers'
import {useGate} from '#/lib/statsig/statsig'
import {emitSoftReset} from '#/state/events'
import {useHomeBadge} from '#/state/home-badge'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {CreateIcon} from '#/components/tao-icons/Create'
import {HomeIcon} from '#/components/tao-icons/Home'
import {HomeSolidIcon} from '#/components/tao-icons/HomeSolid'
import {MessageIcon} from '#/components/tao-icons/Message'
import {MessageSolidIcon} from '#/components/tao-icons/MessageSolid'
import {SearchIcon} from '#/components/tao-icons/Search'
import {SearchSolidIcon} from '#/components/tao-icons/SearchSolid'
import {Text} from '#/components/Typography'
import {styles} from './BottomBarStyles'

type TabOptions =
  | 'Home'
  | 'Search'
  | 'Notifications'
  | 'MyProfile'
  | 'Feeds'
  | 'Messages'

export function BottomBar({navigation}: BottomTabBarProps) {
  const {hasSession, currentAccount} = useSession()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openComposer} = useComposerControls()
  const safeAreaInsets = useSafeAreaInsets()
  const {footerHeight} = useShellLayout()
  const {isAtHome, isAtSearch, isAtMyProfile, isAtMessages} =
    useNavigationTabState()
  const numUnreadNotifications = useUnreadNotifications()
  const numUnreadMessages = useUnreadMessageCount()
  if (!isNaN(parseInt(numUnreadNotifications, 10))) {
    const notif = parseInt(numUnreadNotifications, 10)
    if (notif > 0) {
      numUnreadMessages.count += notif
      numUnreadMessages.hasNew = true
      numUnreadMessages.numUnread = `${
        parseInt(numUnreadMessages.numUnread ?? '0', 10) + notif
      }`
    }
  }
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const dedupe = useDedupe()
  const accountSwitchControl = useDialogControl()
  const playHaptic = useHaptics()
  const hasHomeBadge = useHomeBadge()
  const gate = useGate()
  const iconWidth = 28

  const showSignIn = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
    // setShowLoggedOut(true)
  }, [requestSwitchToAccount, closeAllActiveElements])

  const onPressTab = React.useCallback(
    (tab: TabOptions) => {
      const state = navigation.getState()
      const tabState = getTabState(state, tab)
      if (tabState === TabState.InsideAtRoot) {
        console.log('EMITTING SOFT RESET================')
        emitSoftReset()
      } else if (tabState === TabState.Inside) {
        dedupe(() => navigation.dispatch(StackActions.popToTop()))
      } else {
        dedupe(() => navigation.navigate(`${tab}Tab`))
      }
    },
    [navigation, dedupe],
  )
  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])
  const onPressSearch = React.useCallback(
    () => onPressTab('Search'),
    [onPressTab],
  )
  const onPressProfile = React.useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])
  const onPressMessages = React.useCallback(() => {
    onPressTab('Messages')
  }, [onPressTab])

  const onLongPressProfile = React.useCallback(() => {
    playHaptic()
    accountSwitchControl.open()
  }, [accountSwitchControl, playHaptic])

  const useTransparentBar = isAtHome && isStateAtTabRoot(navigation.getState())

  return (
    <>
      <SwitchAccountDialog control={accountSwitchControl} />

      <Animated.View
        style={[
          styles.bottomBar,
          useTransparentBar ? undefined : pal.view,
          pal.border,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 60)},
          footerMinimalShellTransform,
        ]}
        onLayout={e => {
          footerHeight.set(e.nativeEvent.layout.height)
        }}>
        {hasSession ? (
          <>
            <Btn
              testID="bottomBarHomeBtn"
              label="Home"
              icon={
                isAtHome ? (
                  <HomeSolidIcon
                    width={iconWidth}
                    shadow={pal.textInverted.color?.toString()}
                    style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
                  />
                ) : (
                  <HomeIcon
                    width={iconWidth}
                    shadow={pal.textInverted.color?.toString()}
                    style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
                  />
                )
              }
              hasNew={hasHomeBadge && gate('remove_show_latest_button')}
              onPress={onPressHome}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Home`)}
              accessibilityHint=""
            />
            <Btn
              label="Search"
              icon={
                isAtSearch ? (
                  <SearchSolidIcon
                    width={iconWidth}
                    shadow={pal.textInverted.color?.toString()}
                    style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                  />
                ) : (
                  <SearchIcon
                    testID="bottomBarSearchBtn"
                    width={iconWidth}
                    shadow={pal.textInverted.color?.toString()}
                    style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                  />
                )
              }
              onPress={onPressSearch}
              accessibilityRole="search"
              accessibilityLabel={_(msg`Search`)}
              accessibilityHint=""
            />
            <Btn
              label=""
              icon={
                <CreateIcon
                  testID="bottomBarCreateBtn"
                  width={iconWidth * (4 / 3)}
                  shadow={pal.textInverted.color?.toString()}
                  style={[styles.ctrlIcon, pal.text, styles.createIcon]}
                />
              }
              onPress={() => openComposer({setError: () => {}})}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Create`)}
              accessibilityHint=""
            />
            <Btn
              testID="bottomBarMessagesBtn"
              label="Inbox"
              icon={
                isAtMessages ? (
                  <MessageSolidIcon
                    width={iconWidth}
                    shadow={pal.textInverted.color?.toString()}
                    style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}
                  />
                ) : (
                  <MessageIcon
                    width={iconWidth}
                    shadow={pal.textInverted.color?.toString()}
                    style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}
                  />
                )
              }
              onPress={onPressMessages}
              notificationCount={numUnreadMessages.numUnread}
              hasNew={numUnreadMessages.hasNew}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Chat`)}
              accessibilityHint={
                numUnreadMessages.count > 0
                  ? _(
                      msg`${plural(numUnreadMessages.numUnread ?? 0, {
                        one: '# unread item',
                        other: '# unread items',
                      })}` || '',
                    )
                  : ''
              }
            />
            {/* <Btn
              testID="bottomBarNotificationsBtn"
              icon={
                isAtNotifications ? (
                  <BellFilled
                    width={iconWidth}
                    style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
                  />
                ) : (
                  <Bell
                    width={iconWidth}
                    style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
                  />
                )
              }
              onPress={onPressNotifications}
              notificationCount={numUnreadNotifications}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Notifications`)}
              accessibilityHint={
                numUnreadNotifications === ''
                  ? ''
                  : _(
                      msg`${plural(numUnreadNotifications ?? 0, {
                        one: '# unread item',
                        other: '# unread items',
                      })}` || '',
                    )
              }
            /> */}
            <Btn
              testID="bottomBarProfileBtn"
              label="Profile"
              icon={
                <View style={styles.ctrlIconSizingWrapper}>
                  {isAtMyProfile ? (
                    <View
                      style={[
                        styles.ctrlIcon,
                        pal.text,
                        styles.profileIcon,
                        styles.onProfile,
                        {borderColor: pal.text.color, borderWidth: 3},
                        a.shadow_sm,
                      ]}>
                      <UserAvatar
                        avatar={profile?.avatar}
                        size={iconWidth - 3}
                        // See https://github.com/bluesky-social/social-app/pull/1801:
                        usePlainRNImage={true}
                        type={profile?.associated?.labeler ? 'labeler' : 'user'}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.ctrlIcon,
                        pal.text,
                        styles.profileIcon,
                        {borderColor: 'transparent', borderWidth: 3},
                        a.shadow_sm,
                      ]}>
                      <UserAvatar
                        avatar={profile?.avatar}
                        size={iconWidth - 3}
                        // See https://github.com/bluesky-social/social-app/pull/1801:
                        usePlainRNImage={true}
                        type={profile?.associated?.labeler ? 'labeler' : 'user'}
                      />
                    </View>
                  )}
                </View>
              }
              onPress={onPressProfile}
              onLongPress={onLongPressProfile}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Profile`)}
              accessibilityHint=""
            />
          </>
        ) : (
          <>
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 14,
                paddingBottom: 2,
                paddingLeft: 14,
                paddingRight: 6,
                gap: 8,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Logo width={28} />
                <View style={{paddingTop: 4}}>
                  <Logotype width={80} fill={pal.text.color} />
                </View>
              </View>

              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                <Button
                  onPress={showCreateAccount}
                  label={_(msg`Create account`)}
                  size="small"
                  variant="solid"
                  color="primary">
                  <ButtonText>
                    <Trans>Create account</Trans>
                  </ButtonText>
                </Button>
                <Button
                  onPress={showSignIn}
                  label={_(msg`Sign in`)}
                  size="small"
                  variant="solid"
                  color="secondary">
                  <ButtonText>
                    <Trans>Sign in</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </>
  )
}

interface BtnProps
  extends Pick<
    ComponentProps<typeof PressableScale>,
    | 'accessible'
    | 'accessibilityRole'
    | 'accessibilityHint'
    | 'accessibilityLabel'
  > {
  testID?: string
  icon: JSX.Element
  label: string
  notificationCount?: string
  hasNew?: boolean
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

function Btn({
  testID,
  icon,
  label,
  hasNew,
  notificationCount,
  onPress,
  onLongPress,
  accessible,
  accessibilityHint,
  accessibilityLabel,
}: BtnProps) {
  const pal = usePalette('default')
  return (
    <PressableScale
      testID={testID}
      style={[styles.ctrl, a.flex_1]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      targetScale={0.8}>
      {icon}
      {label && (
        <Text
          style={[
            a.text_center,
            a.pt_xs,
            {
              textShadowColor: pal.colors.textInverted,
              textShadowOffset: {
                width: 1,
                height: 1,
              },
              textShadowRadius: 1,
            },
          ]}>
          <Trans>{label}</Trans>
        </Text>
      )}
      {notificationCount ? (
        <View style={[styles.notificationCount, a.rounded_full]}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : hasNew ? (
        <View style={[styles.hasNewBadge, a.rounded_full]} />
      ) : null}
    </PressableScale>
  )
}
