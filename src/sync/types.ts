import { CardColor, GameAction, Intent } from '../game/types';
import { PublicGame } from '../game/view';

/** `gameState` entry: written only by the host (a moderator). */
export interface GameStatePayload {
  schema: number;
  game: PublicGame;
}

/** `secretKey` entry: sent by the host to itself and the two spymasters only. */
export interface SecretKeyPayload {
  matchId: string;
  key: CardColor[];
}

/** `intents` entry: sent by any player to the host only. */
export interface IntentPayload {
  /** The host it was meant for: intents to a previous host are ignored. */
  hostId: string;
  baseVersion: number;
  action: GameAction;
}

export interface GameEntry {
  entryId: string;
  game: PublicGame;
  /** Older `gameState` entries, for the host to delete. */
  staleEntryIds: string[];
}

export interface SecretKeyEntry {
  entryId: string;
  key: CardColor[];
}

export interface ReceivedIntent {
  entryId: string;
  /** From the entry's `createdBy`, never from the payload. */
  actorId: string;
  /** Null when the payload is malformed: the entry is deleted without being applied. */
  intent: Intent | null;
}
