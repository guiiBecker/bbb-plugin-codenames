import { colorTotals } from './board';
import { BOARD_SIZE, CARD_COLORS } from './constants';
import {
  CardColor, Clue, EndReason, GameState, HistoryEvent, Phase, Roster, Seat, Team, Vote,
  WordListConfig,
} from './types';
import { VoteTally, tallyVotes } from './votes';

/**
 * What everyone may see. A card's color appears only once it is revealed; the full key map only
 * once the match has ended.
 */
export interface PublicGame {
  hostId: string;
  version: number;
  matchId: string | null;
  phase: Phase;
  roster: Roster;
  wordList: WordListConfig;
  words: string[];
  /** Color of each revealed card; null while hidden. */
  revealed: (CardColor | null)[];
  startingTeam: Team | null;
  lastStartingTeam: Team | null;
  /** Words of the last boards, kept out of the next draws (all were on the board already). */
  recentWords: string[];
  turn: Team | null;
  clue: Clue | null;
  guessesLeft: number | null;
  guessesMade: number;
  /** The guessing team's votes; everyone sees them, as when a team talks it over aloud. */
  votes: Vote[];
  winner: Team | null;
  endReason: EndReason | null;
  history: HistoryEvent[];
  /** The complete key map, only after the match ended. */
  key: CardColor[] | null;
}

export const toPublicGame = (state: GameState): PublicGame => ({
  hostId: state.hostId,
  version: state.version,
  matchId: state.matchId,
  phase: state.phase,
  roster: state.roster,
  wordList: state.wordList,
  words: state.words,
  revealed: state.words.map((_, index) => (state.revealed[index] ? state.key[index] : null)),
  startingTeam: state.startingTeam,
  lastStartingTeam: state.lastStartingTeam,
  recentWords: state.recentWords,
  turn: state.turn,
  clue: state.clue,
  guessesLeft: state.guessesLeft,
  guessesMade: state.guessesMade,
  votes: state.votes,
  winner: state.winner,
  endReason: state.endReason,
  history: state.history,
  key: state.phase === 'ended' ? state.key : null,
});

export const isValidKey = (key: unknown): key is CardColor[] => (
  Array.isArray(key)
  && key.length === BOARD_SIZE
  && key.every((color) => CARD_COLORS.includes(color))
);

/**
 * Rebuilds the full state from the public state and the key map (the host after a reload).
 * Returns null when a match is running and the key is missing or contradicts a revealed card.
 */
export const restoreGameState = (
  game: PublicGame,
  secretKey: CardColor[] | null,
): GameState | null => {
  const hasBoard = game.words.length > 0;
  const key = game.key ?? secretKey;
  if (hasBoard && !isValidKey(key)) return null;
  const fullKey = hasBoard ? key as CardColor[] : [];
  const consistent = game.revealed
    .every((color, index) => color === null || color === fullKey[index]);
  if (!consistent) return null;
  return {
    hostId: game.hostId,
    version: game.version,
    matchId: game.matchId,
    phase: game.phase,
    roster: game.roster,
    wordList: game.wordList,
    words: game.words,
    key: fullKey,
    revealed: game.revealed.map((color) => color !== null),
    startingTeam: game.startingTeam,
    lastStartingTeam: game.lastStartingTeam,
    recentWords: game.recentWords,
    turn: game.turn,
    clue: game.clue,
    guessesLeft: game.guessesLeft,
    guessesMade: game.guessesMade,
    votes: game.votes,
    winner: game.winner,
    endReason: game.endReason,
    history: game.history,
  };
};

/** Cards each team still has to find, from public information only. */
export const remainingCards = (game: PublicGame): Record<Team, number> => {
  if (!game.startingTeam) return { red: 0, blue: 0 };
  const totals = colorTotals(game.startingTeam);
  const found = (team: Team) => game.revealed.filter((color) => color === team).length;
  return { red: totals.red - found('red'), blue: totals.blue - found('blue') };
};

export const seatOf = (game: PublicGame, userId: string | null): Seat | null => (
  userId ? game.roster[userId] ?? null : null
);

export const canGiveClue = (game: PublicGame, userId: string | null): boolean => {
  const seat = seatOf(game, userId);
  return game.phase === 'clue' && seat?.role === 'spymaster' && seat.team === game.turn;
};

/** The viewer is an agent of the team guessing now: they vote and may press "Guess". */
export const canGuess = (game: PublicGame, userId: string | null): boolean => {
  const seat = seatOf(game, userId);
  return game.phase === 'guess' && seat?.role === 'agent' && seat.team === game.turn;
};

/** The team's votes, most voted first: the first card is the one "Guess" reveals. */
export const voteTally = (game: PublicGame): VoteTally[] => (
  game.phase === 'guess'
    ? tallyVotes(game.votes, game.roster, game.turn, (index) => game.revealed[index] !== null)
    : []
);

export const canEndTurn = (game: PublicGame, userId: string | null): boolean => (
  canGuess(game, userId) && game.guessesMade > 0
);

/** Words still face down: a clue may not match any of them. */
export const visibleWords = (game: PublicGame): string[] => (
  game.words.filter((_, index) => game.revealed[index] === null)
);
