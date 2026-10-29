import * as React from 'react';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import {
  BbbPluginSdk, NotificationTypeUiCommand, PluginApi, pluginLogger,
} from 'bigbluebutton-html-plugin-sdk';
import { LOG_CODES } from '../../commons/constants';
import { useGetInternationalization } from '../../commons/hooks';
import { CODENAMES_ICON } from '../../commons/icons';
import { commonMessages, errorMessages } from '../../commons/messages';
import { GameAction } from '../../game/types';
import { SettingsProvider } from '../../settings/context';
import { useDefaultWordList } from '../../settings/hooks';
import { createStore } from '../../store/service';
import { GameViewState } from '../../store/types';
import { useGameSync } from '../../sync/hooks';
import { useMeetingUsers } from '../../users/hooks';
import AdminModal from '../admin/component';
import {
  useAppsGalleryEntry,
  useGenericContent,
  useHiddenGame,
  useMediaAreaToggle,
  useOpenSidebarOnStart,
  useTurnNotifications,
  useUsageLogging,
} from './hooks';
import { isModeratorRole } from './service';
import { CodenamesPluginProps, MainContentProps } from './types';

function MainContent({ pluginApi, intl }: MainContentProps) {
  const currentUserResponse = pluginApi.useCurrentUser!();
  const currentUser = currentUserResponse?.data;
  const currentUserError = currentUserResponse?.error;

  useEffect(() => {
    if (!currentUserError) return;
    pluginLogger.error(
      { logCode: LOG_CODES.CURRENT_USER_ERROR, extraInfo: { error: currentUserError.message } },
      `Failed to read the current user in ${pluginApi.pluginName}`,
    );
  }, [currentUserError]);

  // The role decides who may manage the game: on loading or error, treat as non-moderator.
  const isModerator = !currentUserResponse?.loading && !currentUserError
    && isModeratorRole(currentUser?.role);
  const currentUserId = currentUser?.userId ?? null;
  const users = useMeetingUsers(pluginApi);
  const defaultWordList = useDefaultWordList();

  const sync = useGameSync({
    pluginApi, currentUserId, isModerator, users, defaultWordList,
  });
  const { game } = sync;
  const [hidden, setHidden] = useHiddenGame(sync.gameEntryId);
  const showGame = !!game && !hidden;
  // Unknown is not absent: a user-list hiccup must not pause everyone's game.
  const hostPresent = !game || !users.presentUserIds || users.presentUserIds.has(game.hostId);

  const dispatch = useCallback((action: GameAction) => {
    const result = sync.dispatch(action);
    if (!result || result.ok) return;
    // Only the host gets a result: others' actions are checked by the host, and the UI
    // already validates what it can (clues) before sending.
    pluginApi.uiCommands?.notification.send({
      message: intl.formatMessage(errorMessages[result.error], { 0: result.detail ?? '' }),
      icon: { svgContent: CODENAMES_ICON },
      type: NotificationTypeUiCommand.WARNING,
    });
  }, [sync.dispatch, intl]);

  const store = useMemo(() => createStore<GameViewState>({
    intl,
    pluginName: pluginApi.pluginName ?? '',
    currentUserId,
    isModerator,
    isHost: sync.isHost,
    hostReady: sync.hostReady,
    hostPresent,
    game,
    secretKey: sync.secretKey,
    names: users.names,
    presentUserIds: users.presentUserIds,
    pending: sync.pending,
    dispatch,
    closeGame: sync.closeGame,
    openSidebar: null,
    hidden,
    showBoard: () => {},
    takeOver: () => {},
  }), []);

  useEffect(() => {
    store.setState({
      intl,
      currentUserId,
      isModerator,
      isHost: sync.isHost,
      hostReady: sync.hostReady,
      hostPresent,
      game,
      secretKey: sync.secretKey,
      names: users.names,
      presentUserIds: users.presentUserIds,
      pending: sync.pending,
      dispatch,
    });
  }, [
    intl, currentUserId, isModerator, sync.isHost, sync.hostReady, hostPresent, game,
    sync.secretKey, users.names, users.presentUserIds, sync.pending, dispatch,
  ]);

  const [adminOpen, setAdminOpen] = useState(false);
  const openAdmin = useCallback(() => setAdminOpen(true), []);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);
  const showHiddenGame = useCallback(() => setHidden(false), [setHidden]);
  const toggleHidden = useCallback(() => setHidden(!hidden), [setHidden, hidden]);

  const openSidebar = useGenericContent({
    pluginApi, intl, gameOpen: !!game, showGame, store,
  });
  const takeOver = useCallback(() => sync.openGame(true), [sync.openGame]);
  useEffect(() => {
    store.setState({
      openSidebar, closeGame: sync.closeGame, hidden, showBoard: showHiddenGame, takeOver,
    });
  }, [openSidebar, sync.closeGame, hidden, showHiddenGame, takeOver]);
  useOpenSidebarOnStart(game?.matchId ?? null, openSidebar);
  useAppsGalleryEntry({
    pluginApi,
    intl,
    isModerator,
    gameOpen: !!game,
    onOpenAdmin: openAdmin,
  });
  useMediaAreaToggle({
    pluginApi, intl, gameOpen: !!game, hidden, onToggle: toggleHidden,
  });
  useUsageLogging(pluginApi, showGame);
  useTurnNotifications(pluginApi, intl, game, currentUserId);

  if (!isModerator) return null;

  return (
    <AdminModal
      intl={intl}
      isOpen={adminOpen}
      onClose={closeAdmin}
      game={game}
      isHost={sync.isHost}
      hostName={game ? users.names[game.hostId] ?? intl.formatMessage(commonMessages.unknownUser) : ''}
      hostPresent={hostPresent}
      hidden={hidden}
      onShow={showHiddenGame}
      onOpenGame={sync.openGame}
      onCloseGame={sync.closeGame}
      dispatch={dispatch}
    />
  );
}

function CodenamesPlugin({ pluginUuid: uuid }: CodenamesPluginProps) {
  BbbPluginSdk.initialize(uuid);
  const pluginApi: PluginApi = BbbPluginSdk.getPluginApi(uuid);
  const shouldUnmountPlugin = pluginApi.useShouldUnmountPlugin!();
  const { intl } = useGetInternationalization(pluginApi);

  if (shouldUnmountPlugin || !intl) return null;

  return (
    <SettingsProvider pluginApi={pluginApi}>
      <MainContent pluginApi={pluginApi} intl={intl} />
    </SettingsProvider>
  );
}

export default CodenamesPlugin;
