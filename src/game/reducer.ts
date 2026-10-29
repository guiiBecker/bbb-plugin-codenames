import { generateBoard, otherTeam, remainingFor } from './board';
import { guessesAllowed, validateClue } from './clue';
import {
  BOARD_SIZE, RECENT_WORDS_MAX, TEAMS, VERSIONED_ACTIONS,
} from './constants';
import { randomId } from './random';
import { leadingCard, setVote, tallyVotes } from './votes';
import {
  drawCandidates, rosterProblems, rotateSpymasters, seatUser, shuffleRoster, spymasterOf,
} from './roster';
import {
  ActionContext, ActionResult, EndReason, GameAction, GameError, GameState, Intent, Roster,
  RosterProblem, Team, WordListConfig,
} from './types';

const fail = (error: GameError, detail?: string): ActionResult => ({ ok: false, error, detail });

type BoardFields = Omit<
  GameState,
  'hostId' | 'version' | 'phase' | 'roster' | 'wordList' | 'lastStartingTeam' | 'recentWords'
>;

const emptyBoard = (): BoardFields => ({
  matchId: null,
  words: [],
  key: [],
  revealed: [],
  startingTeam: null,
  turn: null,
  clue: null,
  guessesLeft: null,
  guessesMade: 0,
  votes: [],
  winner: null,
  endReason: null,
  history: [],
});

export const createLobby = (
  hostId: string,
  wordList: WordListConfig,
  roster: Roster = {},
): GameState => ({
  ...emptyBoard(),
  hostId,
  version: 0,
  lastStartingTeam: null,
  recentWords: [],
  phase: 'lobby',
  roster,
  wordList,
});

const inPlay = (state: GameState) => state.phase === 'clue' || state.phase === 'guess';

const betweenMatches = (state: GameState) => state.phase === 'lobby' || state.phase === 'ended';

const problemToError = (problem: RosterProblem): GameError => {
  switch (problem.type) {
    case 'noAgent': return 'teamNeedsAgent';
    default: return 'teamNeedsSpymaster';
  }
};

const nextTurn = (state: GameState): GameState => ({
  ...state,
  phase: 'clue',
  turn: otherTeam(state.turn as Team),
  clue: null,
  guessesLeft: null,
  guessesMade: 0,
  votes: [],
});

const finish = (state: GameState, winner: Team | null, reason: EndReason): GameState => ({
  ...state,
  phase: 'ended',
  clue: null,
  guessesLeft: null,
  votes: [],
  winner,
  endReason: reason,
  history: [...state.history, { type: 'end', winner, reason }],
});

/**
 * Deals a new board. After a finished match (same teams), each team gets a new spymaster drawn
 * from its agents. The starting team alternates from one match to the next.
 */
const start = (state: GameState, ctx: ActionContext): ActionResult => {
  const roster = state.phase === 'ended'
    ? rotateSpymasters(state.roster, ctx.rng, ctx.presentUserIds)
    : state.roster;
  const problems = rosterProblems(roster);
  if (problems.length) return fail('teamsNotReady', problems.map((p) => p.type).join(','));
  const startingTeam = state.lastStartingTeam ? otherTeam(state.lastStartingTeam) : undefined;
  const board = generateBoard(
    ctx.resolveWordPool(state.wordList),
    ctx.rng,
    startingTeam,
    state.recentWords,
  );
  if (!board) return fail('notEnoughWords');
  return {
    ok: true,
    state: {
      ...state,
      ...emptyBoard(),
      roster,
      lastStartingTeam: board.startingTeam,
      recentWords: [...state.recentWords, ...board.words].slice(-RECENT_WORDS_MAX),
      matchId: randomId(ctx.rng),
      phase: 'clue',
      words: board.words,
      key: board.key,
      revealed: Array<boolean>(BOARD_SIZE).fill(false),
      startingTeam: board.startingTeam,
      turn: board.startingTeam,
    },
  };
};

const giveClue = (
  state: GameState,
  action: Extract<GameAction, { type: 'giveClue' }>,
  ctx: ActionContext,
): ActionResult => {
  if (state.phase !== 'clue') return fail('wrongPhase');
  const seat = state.roster[ctx.actorId];
  if (seat?.role !== 'spymaster' || seat.team !== state.turn) return fail('notYourTurn');
  const visible = state.words.filter((_, index) => !state.revealed[index]);
  const problem = validateClue(action.word, action.count, visible);
  if (problem) return fail(problem.error, problem.detail);
  const word = action.word.trim();
  return {
    ok: true,
    state: {
      ...state,
      phase: 'guess',
      clue: { team: seat.team, word, count: action.count },
      guessesLeft: guessesAllowed(action.count),
      guessesMade: 0,
      votes: [],
      history: [...state.history, {
        type: 'clue', team: seat.team, word, count: action.count, by: ctx.actorId,
      }],
    },
  };
};

const isGuesser = (state: GameState, actorId: string): boolean => {
  const seat = state.roster[actorId];
  return state.phase === 'guess' && seat?.role === 'agent' && seat.team === state.turn;
};

const checkCard = (state: GameState, index: number): GameError | null => {
  if (!Number.isInteger(index) || index < 0 || index >= state.words.length) return 'invalidCard';
  return state.revealed[index] ? 'cardAlreadyRevealed' : null;
};

const vote = (
  state: GameState,
  action: Extract<GameAction, { type: 'vote' }>,
  ctx: ActionContext,
): ActionResult => {
  if (state.phase !== 'guess') return fail('wrongPhase');
  if (!isGuesser(state, ctx.actorId)) return fail('notYourTurn');
  const problem = checkCard(state, action.index);
  if (problem) return fail(problem);
  return {
    ok: true,
    state: { ...state, votes: setVote(state.votes, ctx.actorId, action.index, action.on) },
  };
};

/** Reveals one card for the team in turn, and settles the turn or the match. */
const reveal = (state: GameState, index: number, actorId: string): GameState => {
  const team = state.turn as Team;
  const color = state.key[index];
  const revealed = state.revealed.map((value, i) => value || i === index);
  let next: GameState = {
    ...state,
    revealed,
    guessesMade: state.guessesMade + 1,
    // Votes for other cards stay: the team may go on guessing with the same clue.
    votes: state.votes.filter((v) => v.index !== index),
    history: [...state.history, {
      type: 'reveal', team, index, word: state.words[index], color, by: actorId,
    }],
  };

  if (color === 'assassin') return finish(next, otherTeam(team), 'assassin');
  // Revealing a team's last card wins for that team, even when the other team revealed it.
  const finishedTeam = TEAMS.find((t) => t === color && remainingFor(t, next.key, revealed) === 0);
  if (finishedTeam) return finish(next, finishedTeam, 'allFound');
  if (color !== team) return nextTurn(next);

  const guessesLeft = state.guessesLeft === null ? null : state.guessesLeft - 1;
  next = { ...next, guessesLeft };
  return guessesLeft === 0 ? nextTurn(next) : next;
};

/**
 * Any agent of the team may guess: the most voted card is revealed. The sender names the card
 * it saw on top; when votes changed on the way, the guess is refused instead of revealing
 * something else.
 */
const guess = (
  state: GameState,
  action: Extract<GameAction, { type: 'guess' }>,
  ctx: ActionContext,
): ActionResult => {
  if (state.phase !== 'guess') return fail('wrongPhase');
  if (!isGuesser(state, ctx.actorId)) return fail('notYourTurn');
  const leader = leadingCard(
    tallyVotes(state.votes, state.roster, state.turn, (i) => state.revealed[i]),
  );
  if (leader === null) return fail('noVotes');
  if (leader !== action.index) return fail('votesChanged');
  return { ok: true, state: reveal(state, leader, ctx.actorId) };
};

const endTurn = (state: GameState, ctx: ActionContext): ActionResult => {
  if (state.phase !== 'guess') return fail('wrongPhase');
  if (!isGuesser(state, ctx.actorId)) return fail('notYourTurn');
  if (state.guessesMade < 1) return fail('mustGuessFirst');
  const team = state.turn as Team;
  return {
    ok: true,
    state: nextTurn({
      ...state,
      history: [...state.history, { type: 'pass', team, by: ctx.actorId }],
    }),
  };
};

const assign = (
  state: GameState,
  action: Extract<GameAction, { type: 'assign' }>,
): ActionResult => {
  const roster = seatUser(state.roster, action.userId, action.seat);
  if (inPlay(state)) {
    // During a match the teams must stay playable.
    const problems = rosterProblems(roster);
    if (problems.length) return fail(problemToError(problems[0]));
  }
  // A player who changes seat (the one assigned, or a spymaster moved to agent) loses their votes.
  const sameSeat = (userId: string) => (
    roster[userId]?.team === state.roster[userId]?.team
    && roster[userId]?.role === state.roster[userId]?.role
  );
  const votes = state.votes.filter((v) => sameSeat(v.userId));
  return { ok: true, state: { ...state, roster, votes } };
};

/** First come, first served: the team's spymaster seat must be free. */
const claimSpymaster = (state: GameState, ctx: ActionContext): ActionResult => {
  if (!betweenMatches(state)) return fail('wrongPhase');
  const seat = state.roster[ctx.actorId];
  if (!seat) return fail('notInTeam');
  if (seat.role === 'spymaster') return { ok: true, state };
  if (spymasterOf(state.roster, seat.team)) return fail('spymasterTaken');
  return {
    ok: true,
    state: { ...state, roster: { ...state.roster, [ctx.actorId]: { team: seat.team, role: 'spymaster' } } },
  };
};

const releaseSpymaster = (state: GameState, ctx: ActionContext): ActionResult => {
  if (!betweenMatches(state)) return fail('wrongPhase');
  const seat = state.roster[ctx.actorId];
  if (!seat) return fail('notInTeam');
  if (seat.role === 'agent') return { ok: true, state };
  return {
    ok: true,
    state: { ...state, roster: { ...state.roster, [ctx.actorId]: { team: seat.team, role: 'agent' } } },
  };
};

const MODERATOR_ACTIONS = new Set<GameAction['type']>([
  'assign', 'shuffleTeams', 'setWordList', 'start', 'abort', 'backToLobby',
]);

const reduce = (state: GameState, action: GameAction, ctx: ActionContext): ActionResult => {
  if (MODERATOR_ACTIONS.has(action.type) && !ctx.actorIsModerator) return fail('notModerator');
  switch (action.type) {
    case 'leave': {
      if (!betweenMatches(state)) return fail('wrongPhase');
      return {
        ok: true,
        state: { ...state, roster: seatUser(state.roster, ctx.actorId, null) },
      };
    }
    case 'claimSpymaster': return claimSpymaster(state, ctx);
    case 'releaseSpymaster': return releaseSpymaster(state, ctx);
    case 'assign': return assign(state, action);
    case 'shuffleTeams': {
      if (!betweenMatches(state)) return fail('wrongPhase');
      const candidates = drawCandidates(state.roster, ctx.presentUserIds);
      const roster = shuffleRoster(candidates, ctx.rng, ctx.presentUserIds);
      return roster ? { ok: true, state: { ...state, roster } } : fail('notEnoughPlayers');
    }
    case 'setWordList': {
      if (!betweenMatches(state)) return fail('wrongPhase');
      return { ok: true, state: { ...state, wordList: action.wordList } };
    }
    case 'start': return start(state, ctx);
    case 'giveClue': return giveClue(state, action, ctx);
    case 'vote': return vote(state, action, ctx);
    case 'guess': return guess(state, action, ctx);
    case 'endTurn': return endTurn(state, ctx);
    case 'abort': {
      if (!inPlay(state)) return fail('wrongPhase');
      return { ok: true, state: finish(state, null, 'aborted') };
    }
    case 'backToLobby': {
      if (state.phase === 'lobby') return fail('wrongPhase');
      return { ok: true, state: { ...state, ...emptyBoard(), phase: 'lobby' } };
    }
    default: return fail('invalidAction');
  }
};

/** Applies an action. Every applied action increments the version. */
export const applyAction = (
  state: GameState,
  action: GameAction,
  ctx: ActionContext,
): ActionResult => {
  const result = reduce(state, action, ctx);
  return result.ok
    ? { ok: true, state: { ...result.state, version: state.version + 1 } }
    : result;
};

/** Applies an intent from another client; turn actions based on an older version are dropped. */
export const applyIntent = (
  state: GameState,
  intent: Intent,
  ctx: ActionContext,
): ActionResult => {
  if (VERSIONED_ACTIONS.has(intent.action.type) && intent.baseVersion !== state.version) {
    return fail('stale');
  }
  return applyAction(state, intent.action, ctx);
};
