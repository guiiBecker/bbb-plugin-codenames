import {
  DataChannelEntryResponseType, DeleteEntryFunction, PluginApi, PushEntryFunction,
} from 'bigbluebutton-html-plugin-sdk';
import {
  ActionResult, CardColor, GameAction, WordListId,
} from '../game/types';
import { PublicGame } from '../game/view';
import { MeetingUsers } from '../users/types';
import {
  GameEntry, GameStatePayload, IntentPayload, SecretKeyEntry, SecretKeyPayload,
} from './types';

/** Not exported by the SDK index. */
type ReplaceEntryFunction<T> = (entryId: string, payloadJson: T) => void;

export interface GameChannels {
  loading: boolean;
  keyLoading: boolean;
  gameEntry: GameEntry | null;
  /** The key map, when this user is one of its receivers. */
  secret: SecretKeyEntry | null;
  keyEntries: DataChannelEntryResponseType<SecretKeyPayload>[];
  intentEntries: DataChannelEntryResponseType<IntentPayload>[];
  pushGame: PushEntryFunction<GameStatePayload>;
  replaceGame: ReplaceEntryFunction<GameStatePayload>;
  deleteGame: DeleteEntryFunction;
  pushKey: PushEntryFunction<SecretKeyPayload>;
  deleteKey: DeleteEntryFunction;
  pushIntent: PushEntryFunction<IntentPayload>;
  deleteIntent: DeleteEntryFunction;
}

export interface UseHostAuthorityOptions {
  pluginApi: PluginApi;
  channels: GameChannels;
  currentUserId: string | null;
  users: MeetingUsers;
}

export interface HostAuthority {
  isHost: boolean;
  /** The host restored its full state and is applying actions. */
  hostReady: boolean;
  apply: (
    action: GameAction,
    actorId: string,
    actorIsModerator: boolean,
    baseVersion?: number,
  ) => ActionResult;
  /** Forgets the held state, before a new game replaces it. */
  reset: () => void;
}

export interface UseGameSyncOptions {
  pluginApi: PluginApi;
  currentUserId: string | null;
  isModerator: boolean;
  users: MeetingUsers;
  defaultWordList: WordListId;
}

export interface GameSync {
  loading: boolean;
  /** Id of the game's entry: a new game is a new entry. */
  gameEntryId: string | null;
  game: PublicGame | null;
  /** The key map, for the host and the spymasters (everyone once the match ended). */
  secretKey: CardColor[] | null;
  isHost: boolean;
  hostReady: boolean;
  /** An action of this user is waiting for the host. */
  pending: boolean;
  /**
   * Sends an action. The host applies it at once and gets the result; anyone else sends it to
   * the host and gets null.
   */
  dispatch: (action: GameAction) => ActionResult | null;
  /** Opens a new game (lobby) with this moderator as host, optionally keeping the teams. */
  openGame: (keepTeams: boolean) => void;
  /** Closes the game for everyone. */
  closeGame: () => void;
}
