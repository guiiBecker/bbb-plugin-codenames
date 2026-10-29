import * as React from 'react';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import * as ReactDOM from 'react-dom/client';
import { IntlShape } from 'react-intl';
import {
  AppsGalleryEntry,
  GenericContentMainArea,
  GenericContentSidekickArea,
  MediaAreaOption,
  NotificationTypeUiCommand,
  PluginApi,
  pluginLogger,
} from 'bigbluebutton-html-plugin-sdk';
import { DATA_TEST, LOG_CODES } from '../../commons/constants';
import { countLabel, teamLabel } from '../../commons/format';
import { CODENAMES_ICON } from '../../commons/icons';
import { commonMessages } from '../../commons/messages';
import { PublicGame } from '../../game/view';
import GameView from '../game-view/component';
import Sidebar from '../sidebar/component';
import { intlMessages as sidebarMessages } from '../sidebar/messages';
import { intlMessages } from './messages';
import { readHiddenGame, writeHiddenGame } from './service';
import {
  AppsGalleryEntryOptions, GenericContentOptions, MediaAreaToggleOptions,
} from './types';

/** Per-viewer "hide the game" choice, scoped to one opened game. */
export const useHiddenGame = (gameEntryId: string | null) => {
  const [hidden, setHiddenState] = useState(false);

  useEffect(() => {
    setHiddenState(gameEntryId ? readHiddenGame(gameEntryId) : false);
  }, [gameEntryId]);

  const setHidden = useCallback((value: boolean) => {
    if (gameEntryId) writeHiddenGame(gameEntryId, value);
    setHiddenState(value);
  }, [gameEntryId]);

  return [hidden, setHidden] as const;
};

/**
 * Before a game is open, moderators get an entry that opens one. Once it is open, the game's
 * entry is the sidebar panel (see useGenericContent), so there is a single "Codenames" icon.
 */
export const useAppsGalleryEntry = ({
  pluginApi, intl, isModerator, gameOpen, onOpenAdmin,
}: AppsGalleryEntryOptions) => {
  useEffect(() => {
    if (!isModerator || gameOpen) return undefined;
    pluginApi.setAppsGalleryItems([
      new AppsGalleryEntry({
        name: intl.formatMessage(commonMessages.appName),
        icon: { svgContent: CODENAMES_ICON },
        dataTest: DATA_TEST.APPS_GALLERY_ENTRY,
        onClick: onOpenAdmin,
      }),
    ]);
    return () => { pluginApi.setAppsGalleryItems([]); };
  }, [intl, isModerator, gameOpen, onOpenAdmin]);
};

/**
 * Opens the sidebar panel when a match starts, so everyone has the rounds in view. Never on the
 * first read: someone joining or reloading mid-match keeps their sidebar as it is.
 */
export const useOpenSidebarOnStart = (
  matchId: string | null,
  openSidebar: (() => void) | null,
) => {
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const before = previous.current;
    previous.current = matchId;
    if (before === undefined || !matchId || matchId === before || !openSidebar) return;
    openSidebar();
  }, [matchId, openSidebar]);
};

export const useMediaAreaToggle = ({
  pluginApi, intl, gameOpen, hidden, onToggle,
}: MediaAreaToggleOptions) => {
  useEffect(() => {
    if (!gameOpen) return undefined;
    const label = intl.formatMessage(
      hidden ? intlMessages.showGame : intlMessages.showPresentation,
    );
    pluginApi.setMediaAreaItems([
      new MediaAreaOption({
        label,
        tooltip: label,
        icon: { svgContent: CODENAMES_ICON },
        dataTest: DATA_TEST.MEDIA_AREA_TOGGLE,
        allowed: true,
        onClick: onToggle,
      }),
    ]);
    return () => { pluginApi.setMediaAreaItems([]); };
  }, [intl, gameOpen, hidden, onToggle]);
};

type HeldRoot = { element: HTMLElement; root: ReactDOM.Root } | null;

/**
 * The root for the client's container, reused while the container is the same node: the
 * client may call contentFunction again for it, and a second createRoot on one element
 * leaves it blank.
 */
const rootFor = (held: HeldRoot, element: HTMLElement): NonNullable<HeldRoot> => (
  held && held.element === element ? held : { element, root: ReactDOM.createRoot(element) }
);

/**
 * The plugin's generic content: the board in the main area while shown, and the sidebar panel
 * (rounds, moderator controls) while a game is open, even with the board hidden. Both go in one
 * call, since each call replaces all of the plugin's items. Reusing the ids keeps an open panel
 * open when the board is shown or hidden. Returns a function that opens the panel.
 */
export const useGenericContent = ({
  pluginApi, intl, gameOpen, showGame, store,
}: GenericContentOptions): (() => void) | null => {
  const ids = useRef<{ sidebar?: string; main?: string }>({});
  const sidebarRoot = useRef<HeldRoot>(null);
  const mainRoot = useRef<HeldRoot>(null);
  const [sidebarId, setSidebarId] = useState<string | null>(null);
  const sidebarName = intl.formatMessage(sidebarMessages.title);

  useEffect(() => {
    const sidebar = gameOpen ? new GenericContentSidekickArea({
      ...(ids.current.sidebar && { id: ids.current.sidebar }),
      name: sidebarName,
      section: '',
      buttonIcon: { svgContent: CODENAMES_ICON },
      open: false,
      dataTest: DATA_TEST.SIDEBAR_AREA,
      contentFunction: (element: HTMLElement) => {
        sidebarRoot.current = rootFor(sidebarRoot.current, element);
        sidebarRoot.current.root.render(<Sidebar store={store} />);
        return sidebarRoot.current.root;
      },
    }) : null;
    const main = showGame ? new GenericContentMainArea({
      ...(ids.current.main && { id: ids.current.main }),
      dataTest: DATA_TEST.MAIN_AREA,
      contentFunction: (element: HTMLElement) => {
        mainRoot.current = rootFor(mainRoot.current, element);
        mainRoot.current.root.render(<GameView store={store} />);
        return mainRoot.current.root;
      },
    }) : null;
    const items = [sidebar, main].filter((item) => item !== null);
    const generated = pluginApi.setGenericContentItems(items);
    ids.current = {
      sidebar: sidebar ? generated[0] : undefined,
      main: main ? generated[sidebar ? 1 : 0] : undefined,
    };
    setSidebarId(ids.current.sidebar ?? null);
    // Every dependency must be stable: registering re-renders the client, and a fresh
    // identity here would register again forever. `intl` is memoized; the rest are
    // primitives or the store, created once.
  }, [gameOpen, showGame, store, sidebarName]);

  useEffect(() => () => { pluginApi.setGenericContentItems([]); }, []);

  return useMemo(() => (sidebarId
    ? () => { pluginApi.uiCommands?.sidekickArea?.panel?.open(sidebarId); }
    : null), [sidebarId]);
};

/** Mandatory usage logs: the game starts and stops being shown on this client. */
export const useUsageLogging = (pluginApi: PluginApi, showGame: boolean) => {
  useEffect(() => {
    if (!showGame) return undefined;
    pluginLogger.info({ logCode: LOG_CODES.STARTED }, `Plugin started: ${pluginApi.pluginName}`);
    return () => {
      pluginLogger.info({ logCode: LOG_CODES.STOPPED }, `Plugin stopped: ${pluginApi.pluginName}`);
    };
  }, [showGame]);
};

interface TurnSnapshot {
  matchId: string | null;
  phase: PublicGame['phase'];
  turn: PublicGame['turn'];
}

/** Toasts for the moments that matter to this viewer: a new match, their turn, the end. */
export const useTurnNotifications = (
  pluginApi: PluginApi,
  intl: IntlShape,
  game: PublicGame | null,
  currentUserId: string | null,
) => {
  const previous = useRef<TurnSnapshot | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = game ? { matchId: game.matchId, phase: game.phase, turn: game.turn } : null;
    // Never on the first read: someone joining late or reloading gets no stale toasts.
    if (!game || !before || !game.turn) return;
    const changed = before.phase !== game.phase || before.turn !== game.turn
      || before.matchId !== game.matchId;
    if (!changed) return;

    const seat = currentUserId ? game.roster[currentUserId] : undefined;
    const team = teamLabel(intl, game.turn, true);
    let message: string | null = null;
    if (game.phase === 'ended') {
      message = game.winner
        ? intl.formatMessage(intlMessages.winner, { 0: teamLabel(intl, game.winner, true) })
        : intl.formatMessage(intlMessages.aborted);
    } else if (before.matchId !== game.matchId) {
      message = intl.formatMessage(intlMessages.matchStarted, { 0: team });
    } else if (game.phase === 'clue' && seat?.role === 'spymaster' && seat.team === game.turn) {
      message = intl.formatMessage(intlMessages.yourClue);
    } else if (game.phase === 'guess' && seat?.role === 'agent' && seat.team === game.turn && game.clue) {
      message = intl.formatMessage(intlMessages.yourGuess, {
        0: game.clue.word, 1: countLabel(intl, game.clue.count),
      });
    }
    if (!message) return;
    pluginApi.uiCommands?.notification.send({
      message,
      icon: { svgContent: CODENAMES_ICON },
      type: NotificationTypeUiCommand.INFO,
    });
  }, [game?.matchId, game?.phase, game?.turn]);
};
