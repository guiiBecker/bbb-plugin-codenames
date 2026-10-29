import { DataChannelEntryResponseType } from 'bigbluebutton-html-plugin-sdk';
import { isValidClueCount } from '../game/clue';
import {
  BOARD_SIZE, CARD_COLORS, RECENT_WORDS_MAX, TEAMS,
} from '../game/constants';
import { spymasterOf } from '../game/roster';
import {
  CardColor, Clue, EndReason, GameAction, GameState, HistoryEvent, Phase, Roster, Seat, Team, Vote,
} from '../game/types';
import { PublicGame, isValidKey } from '../game/view';
import { sanitizeWordList } from '../words/service';
import {
  MAX_CLUE_PAYLOAD_LENGTH, MAX_HISTORY_EVENTS, MAX_VOTES, MAX_WORD_PAYLOAD_LENGTH, PAYLOAD_SCHEMA,
} from './constants';
import {
  GameEntry, GameStatePayload, IntentPayload, ReceivedIntent, SecretKeyEntry, SecretKeyPayload,
} from './types';

type Entry<T> = DataChannelEntryResponseType<T>;
type Raw = Record<string, unknown>;

const PHASES: readonly Phase[] = ['lobby', 'clue', 'guess', 'ended'];
const END_REASONS: readonly EndReason[] = ['allFound', 'assassin', 'aborted'];

const isObject = (value: unknown): value is Raw => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);
const isTeam = (value: unknown): value is Team => TEAMS.includes(value as Team);
const isColor = (value: unknown): value is CardColor => CARD_COLORS.includes(value as CardColor);
const isNonNegativeInt = (value: unknown): value is number => (
  typeof value === 'number' && Number.isInteger(value) && value >= 0
);
const isUserId = (value: unknown): value is string => (
  typeof value === 'string' && value.length > 0 && value.length <= 100
);
const teamOrNull = (value: unknown): Team | null => (isTeam(value) ? value : null);

const byCreatedAtDesc = <T>(a: Entry<T>, b: Entry<T>) => (
  Date.parse(b.createdAt) - Date.parse(a.createdAt)
);

export const sanitizeSeat = (value: unknown): Seat | null => {
  if (!isObject(value) || !isTeam(value.team)) return null;
  if (value.role !== 'spymaster' && value.role !== 'agent') return null;
  return { team: value.team, role: value.role };
};

export const sanitizeRoster = (value: unknown): Roster => {
  if (!isObject(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([userId, seat]) => [userId, sanitizeSeat(seat)] as const)
    .filter((pair): pair is [string, Seat] => isUserId(pair[0]) && pair[1] !== null));
};

const isCardIndex = (value: unknown): value is number => (
  isNonNegativeInt(value) && value < BOARD_SIZE
);

/** Valid votes on the board, each user once per card; missing in older entries. */
export const sanitizeVotes = (value: unknown): Vote[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.slice(0, MAX_VOTES).filter((vote): vote is Vote => {
    if (!isObject(vote) || !isUserId(vote.userId) || !isCardIndex(vote.index)) return false;
    const id = `${vote.userId}|${vote.index}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).map(({ userId, index }) => ({ userId, index }));
};

const sanitizeClue = (value: unknown): Clue | null => {
  if (!isObject(value) || !isTeam(value.team) || typeof value.word !== 'string') return null;
  if (!isValidClueCount(value.count)) return null;
  return {
    team: value.team, word: value.word.slice(0, MAX_CLUE_PAYLOAD_LENGTH), count: value.count,
  };
};

const sanitizeHistoryEvent = (value: unknown): HistoryEvent | null => {
  if (!isObject(value)) return null;
  switch (value.type) {
    case 'clue': {
      const clue = sanitizeClue(value);
      return clue && isUserId(value.by) ? { type: 'clue', ...clue, by: value.by } : null;
    }
    case 'reveal':
      if (!isTeam(value.team) || !isNonNegativeInt(value.index) || value.index >= BOARD_SIZE
        || typeof value.word !== 'string' || !isColor(value.color) || !isUserId(value.by)) return null;
      return {
        type: 'reveal', team: value.team, index: value.index, word: value.word, color: value.color, by: value.by,
      };
    case 'pass':
      return isTeam(value.team) && isUserId(value.by)
        ? { type: 'pass', team: value.team, by: value.by } : null;
    case 'end':
      return END_REASONS.includes(value.reason as EndReason)
        ? { type: 'end', winner: teamOrNull(value.winner), reason: value.reason as EndReason } : null;
    default:
      return null;
  }
};

/** Validates every field of a public game; anything inconsistent rejects the whole state. */
export const sanitizePublicGame = (value: unknown): PublicGame | null => {
  if (!isObject(value) || !isUserId(value.hostId) || !isNonNegativeInt(value.version)) return null;
  if (!PHASES.includes(value.phase as Phase)) return null;
  const phase = value.phase as Phase;
  const words = Array.isArray(value.words) && value.words.every((word) => typeof word === 'string')
    ? value.words as string[] : null;
  if (!words || (words.length !== 0 && words.length !== BOARD_SIZE)) return null;
  const revealed = Array.isArray(value.revealed) ? value.revealed : [];
  if (revealed.length !== words.length || !revealed.every((c) => c === null || isColor(c))) {
    return null;
  }
  const hasBoard = words.length === BOARD_SIZE;
  if (phase !== 'lobby' && (!hasBoard || !isTeam(value.startingTeam) || !isTeam(value.turn))) {
    return null;
  }
  const key = value.key === null || value.key === undefined ? null : value.key;
  if (key !== null && !isValidKey(key)) return null;
  const guessesLeft = value.guessesLeft === null ? null : value.guessesLeft;
  if (guessesLeft !== null && !isNonNegativeInt(guessesLeft)) return null;
  const history = Array.isArray(value.history) ? value.history.slice(-MAX_HISTORY_EVENTS) : [];
  const roster = sanitizeRoster(value.roster);

  return {
    hostId: value.hostId,
    version: value.version,
    matchId: typeof value.matchId === 'string' ? value.matchId : null,
    phase,
    roster,
    wordList: sanitizeWordList(value.wordList),
    words,
    revealed: revealed as (CardColor | null)[],
    startingTeam: teamOrNull(value.startingTeam),
    lastStartingTeam: teamOrNull(value.lastStartingTeam),
    recentWords: Array.isArray(value.recentWords)
      ? value.recentWords
        .filter((word): word is string => typeof word === 'string' && word.length <= MAX_WORD_PAYLOAD_LENGTH)
        .slice(-RECENT_WORDS_MAX)
      : [],
    turn: teamOrNull(value.turn),
    clue: sanitizeClue(value.clue),
    guessesLeft,
    guessesMade: isNonNegativeInt(value.guessesMade) ? value.guessesMade : 0,
    votes: phase === 'guess' ? sanitizeVotes(value.votes) : [],
    winner: teamOrNull(value.winner),
    endReason: END_REASONS.includes(value.endReason as EndReason)
      ? value.endReason as EndReason : null,
    history: history.map(sanitizeHistoryEvent).filter((e): e is HistoryEvent => e !== null),
    key: key as CardColor[] | null,
  };
};

/**
 * The newest valid `gameState` entry is the game. An entry is valid only when its author is the
 * host it names, so a forged entry (another moderator claiming someone else is host) is ignored.
 */
export const parseGameState = (
  entries: Entry<GameStatePayload>[] | undefined,
): GameEntry | null => {
  const sorted = [...(entries ?? [])].sort(byCreatedAtDesc);
  let found: { entryId: string; game: PublicGame } | null = null;
  sorted.some((entry) => {
    const payload = entry.payloadJson as unknown;
    if (!isObject(payload) || payload.schema !== PAYLOAD_SCHEMA) return false;
    const game = sanitizePublicGame(payload.game);
    if (!game || game.hostId !== entry.createdBy) return false;
    found = { entryId: entry.entryId, game };
    return true;
  });
  if (!found) return null;
  const { entryId, game } = found as { entryId: string; game: PublicGame };
  return {
    entryId,
    game,
    staleEntryIds: sorted.map((entry) => entry.entryId).filter((id) => id !== entryId),
  };
};

/** The key map of the running match, when this user received it from the host. */
export const parseSecretKey = (
  entries: Entry<SecretKeyPayload>[] | undefined,
  game: PublicGame | null,
): SecretKeyEntry | null => {
  if (!game?.matchId) return null;
  const match = [...(entries ?? [])].sort(byCreatedAtDesc).find((entry) => (
    entry.createdBy === game.hostId
    && entry.payloadJson?.matchId === game.matchId
    && isValidKey(entry.payloadJson?.key)
  ));
  return match ? { entryId: match.entryId, key: match.payloadJson.key } : null;
};

export const sanitizeAction = (value: unknown): GameAction | null => {
  if (!isObject(value)) return null;
  switch (value.type) {
    case 'leave':
    case 'claimSpymaster':
    case 'releaseSpymaster':
    case 'shuffleTeams':
    case 'start':
    case 'endTurn':
    case 'abort':
    case 'backToLobby':
      return { type: value.type };
    case 'assign':
      if (!isUserId(value.userId)) return null;
      return { type: 'assign', userId: value.userId, seat: sanitizeSeat(value.seat) };
    case 'setWordList':
      return { type: 'setWordList', wordList: sanitizeWordList(value.wordList) };
    case 'giveClue':
      if (typeof value.word !== 'string' || value.word.length > MAX_CLUE_PAYLOAD_LENGTH) return null;
      if (!isValidClueCount(value.count)) return null;
      return { type: 'giveClue', word: value.word, count: value.count };
    case 'vote':
      return isNonNegativeInt(value.index) && typeof value.on === 'boolean'
        ? { type: 'vote', index: value.index, on: value.on } : null;
    case 'guess':
      return isNonNegativeInt(value.index) ? { type: 'guess', index: value.index } : null;
    default:
      return null;
  }
};

/** Intents addressed to this host, oldest first. The actor is the entry's creator. */
export const parseIntents = (
  entries: Entry<IntentPayload>[] | undefined,
  hostId: string,
): ReceivedIntent[] => [...(entries ?? [])]
  .sort((a, b) => byCreatedAtDesc(b, a))
  .filter((entry) => isUserId(entry.createdBy))
  .map((entry) => {
    const payload = entry.payloadJson as unknown;
    const valid = isObject(payload) && payload.hostId === hostId
      && Number.isInteger(payload.baseVersion);
    const action = valid ? sanitizeAction(payload.action) : null;
    return {
      entryId: entry.entryId,
      actorId: entry.createdBy,
      intent: valid && action ? { action, baseVersion: payload.baseVersion as number } : null,
    };
  });

/** Who receives the key map: the host (to recover after a reload) and both spymasters. */
export const keyReceivers = (state: GameState): string[] => [...new Set([
  state.hostId,
  ...TEAMS.map((team) => spymasterOf(state.roster, team)),
].filter((userId): userId is string => !!userId))];

/** Identifies a published key: a new match or a new set of receivers needs a new entry. */
export const keySignature = (state: GameState): string => (
  `${state.matchId}|${[...keyReceivers(state)].sort().join(',')}`
);

export const toGameStatePayload = (game: PublicGame): GameStatePayload => ({
  schema: PAYLOAD_SCHEMA,
  game,
});
