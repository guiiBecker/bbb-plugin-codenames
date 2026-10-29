import { CardColor, GameActionType, Team } from './types';

export const GRID_SIZE = 5;

export const BOARD_SIZE = GRID_SIZE * GRID_SIZE;

/** Cards per color. The starting team always has one card more. */
export const CARD_COUNTS = {
  startingTeam: 9,
  otherTeam: 8,
  neutral: 7,
  assassin: 1,
} as const;

export const TEAMS: readonly Team[] = ['red', 'blue'];

export const CARD_COLORS: readonly CardColor[] = ['red', 'blue', 'neutral', 'assassin'];

export const CLUE_MAX_LENGTH = 30;

/**
 * Words of the last boards kept out of the next draws, so boards do not repeat: three boards'
 * worth. Older words go back into the draw.
 */
export const RECENT_WORDS_MAX = 3 * 25;

export const CLUE_MAX_COUNT = 9;

/** One word: letters and digits, optionally joined by a hyphen or an apostrophe. */
export const ONE_WORD_PATTERN = /^[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*$/u;

/**
 * Actions rejected when based on an older version. Votes move the version all the time, so
 * the guessing actions are not versioned: `guess` names the card it expects instead, and votes,
 * `endTurn`, lobby and moderator actions are idempotent and always apply.
 */
export const VERSIONED_ACTIONS: ReadonlySet<GameActionType> = new Set<GameActionType>([
  'giveClue',
]);

/** After these, the sender's UI waits for the host's answer before accepting another one. */
export const AWAITED_ACTIONS: ReadonlySet<GameActionType> = new Set<GameActionType>([
  'giveClue', 'guess', 'endTurn',
]);

export const MATCH_ID_LENGTH = 12;

export const MATCH_ID_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
