/** Pure game model: nothing here depends on BigBlueButton. */

export type Team = 'red' | 'blue';

export type CardColor = Team | 'neutral' | 'assassin';

export type Role = 'spymaster' | 'agent';

/** `clue`: waiting for the spymaster; `guess`: the agents are guessing. */
export type Phase = 'lobby' | 'clue' | 'guess' | 'ended';

/** 0 and `unlimited` both allow unlimited guesses, as in the official rules. */
export type ClueCount = number | 'unlimited';

export type WordListId = 'pt-BR' | 'en' | 'custom';

export type EndReason = 'allFound' | 'assassin' | 'aborted';

export interface Seat {
  team: Team;
  role: Role;
}

/** Seats by user id. A user without a seat is a spectator. */
export type Roster = Record<string, Seat>;

/** An agent's vote for a face-down card, during their team's guesses. */
export interface Vote {
  userId: string;
  index: number;
}

export interface Clue {
  team: Team;
  word: string;
  count: ClueCount;
}

export interface WordListConfig {
  id: WordListId;
  /** Only used when `id` is `custom`. */
  customWords: string[];
}

export type HistoryEvent =
  | { type: 'clue'; team: Team; word: string; count: ClueCount; by: string }
  | { type: 'reveal'; team: Team; index: number; word: string; color: CardColor; by: string }
  | { type: 'pass'; team: Team; by: string }
  | { type: 'end'; winner: Team | null; reason: EndReason };

/** The complete state, key included. Only the host holds it. */
export interface GameState {
  hostId: string;
  /** Incremented by every applied action; stale turn actions are rejected against it. */
  version: number;
  /** New for every board; null in the lobby. */
  matchId: string | null;
  phase: Phase;
  roster: Roster;
  wordList: WordListConfig;
  words: string[];
  /** The secret key map: the color of each card. */
  key: CardColor[];
  revealed: boolean[];
  startingTeam: Team | null;
  /**
   * Words of the last boards (at most RECENT_WORDS_MAX, oldest first), left out of the next
   * draws. Lives as long as the game: a new game starts with none.
   */
  recentWords: string[];
  /** Who started the previous match: the next one starts with the other team. */
  lastStartingTeam: Team | null;
  turn: Team | null;
  clue: Clue | null;
  /** Guesses the team may still make this turn; null means unlimited. */
  guessesLeft: number | null;
  guessesMade: number;
  /** The guessing team's votes, in the order they were cast; emptied when the turn ends. */
  votes: Vote[];
  winner: Team | null;
  endReason: EndReason | null;
  history: HistoryEvent[];
}

export type GameAction =
  | { type: 'leave' }
  /** A seated player takes their team's free spymaster seat, or gives it back. */
  | { type: 'claimSpymaster' }
  | { type: 'releaseSpymaster' }
  | { type: 'assign'; userId: string; seat: Seat | null }
  | { type: 'shuffleTeams' }
  | { type: 'setWordList'; wordList: WordListConfig }
  | { type: 'start' }
  | { type: 'giveClue'; word: string; count: ClueCount }
  | { type: 'vote'; index: number; on: boolean }
  /** Reveals the most voted card; `index` is the card the sender saw on top, as a check. */
  | { type: 'guess'; index: number }
  | { type: 'endTurn' }
  | { type: 'abort' }
  | { type: 'backToLobby' };

export type GameActionType = GameAction['type'];

/** A uniform random number in [0, 1). */
export type Rng = () => number;

export interface ActionContext {
  actorId: string;
  actorIsModerator: boolean;
  rng: Rng;
  /** The words a new board is drawn from, for the configured list. */
  resolveWordPool: (config: WordListConfig) => string[];
  /** Users in the meeting: the draw is among them; null when unknown. */
  presentUserIds?: ReadonlySet<string> | null;
}

export type GameError =
  | 'notModerator'
  | 'wrongPhase'
  | 'notYourTurn'
  | 'spymasterTaken'
  | 'notInTeam'
  | 'teamsNotReady'
  | 'notEnoughPlayers'
  | 'notEnoughWords'
  | 'clueEmpty'
  | 'clueNotOneWord'
  | 'clueTooLong'
  | 'clueMatchesBoard'
  | 'invalidClueCount'
  | 'invalidCard'
  | 'cardAlreadyRevealed'
  | 'mustGuessFirst'
  | 'noVotes'
  | 'votesChanged'
  | 'teamNeedsSpymaster'
  | 'teamNeedsAgent'
  | 'stale'
  | 'invalidAction';

export type ActionResult =
  | { ok: true; state: GameState }
  | { ok: false; error: GameError; detail?: string };

/** An action sent by a player who is not the host, stamped with the version it was based on. */
export interface Intent {
  action: GameAction;
  baseVersion: number;
}

export type RosterProblem =
  | { type: 'noSpymaster'; team: Team }
  | { type: 'tooManySpymasters'; team: Team }
  | { type: 'noAgent'; team: Team };
