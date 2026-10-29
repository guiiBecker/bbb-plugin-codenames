import { IntlShape } from 'react-intl';
import { CardColor, GameAction } from '../game/types';
import { PublicGame } from '../game/view';

/** What the main-area game root needs from the always-mounted main component. */
export interface GameViewState {
  intl: IntlShape;
  pluginName: string;
  currentUserId: string | null;
  isModerator: boolean;
  isHost: boolean;
  /** False while the host's client has not restored the match (or is gone). */
  hostReady: boolean;
  hostPresent: boolean;
  game: PublicGame | null;
  /** The key map, for the host and the spymasters (everyone once the match ended). */
  secretKey: CardColor[] | null;
  /** Display names by user id. */
  names: Record<string, string>;
  presentUserIds: Set<string> | null;
  /** An action of this user is waiting for the host. */
  pending: boolean;
  dispatch: (action: GameAction) => void;
  /** Closes the game for everyone (moderators only). */
  closeGame: () => void;
  /** Opens the plugin's sidebar panel; null until the panel is registered. */
  openSidebar: (() => void) | null;
  /** This viewer hid the board (the presentation is back in the main area). */
  hidden: boolean;
  /** Shows the board again. */
  showBoard: () => void;
  /** Makes this moderator the host: a new lobby with the same teams. */
  takeOver: () => void;
}

export interface Store<T> {
  getSnapshot: () => T;
  setState: (partial: Partial<T>) => void;
  subscribe: (listener: () => void) => () => void;
}
