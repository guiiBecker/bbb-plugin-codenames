import { describe, expect, it } from 'vitest';
import { applyAction, applyIntent, createLobby } from '../../src/game/reducer';
import { ActionResult, GameAction, GameState } from '../../src/game/types';
import { tallyVotes } from '../../src/game/votes';
import {
  ASSASSIN, BLUE, HOST, NEUTRAL, RED, ROSTER, ctx, playingState, seededRng,
} from './helpers/game';

const ok = (result: ActionResult): GameState => {
  if (!result.ok) throw new Error(`expected success, got ${result.error}`);
  return result.state;
};

const errorOf = (result: ActionResult) => (result.ok ? null : result.error);

/** Plays a sequence of [actor, action] and returns the final state. */
const play = (state: GameState, steps: [string, GameAction][]): GameState => steps.reduce(
  (current, [actor, action]) => ok(applyAction(current, action, ctx(actor))),
  state,
);

const clue = (word: string, count: number | 'unlimited'): GameAction => ({ type: 'giveClue', word, count });
const vote = (index: number, on = true): GameAction => ({ type: 'vote', index, on });
const guess = (index: number): GameAction => ({ type: 'guess', index });

/** One agent votes for a card and guesses it: the steps for `play`. */
const pick = (actor: string, index: number): [string, GameAction][] => [
  [actor, vote(index)], [actor, guess(index)],
];

/** The same as one action: the vote's refusal, or the guess's result. */
const reveal = (state: GameState, index: number, actor: string): ActionResult => {
  const voted = applyAction(state, vote(index), ctx(actor));
  return voted.ok ? applyAction(voted.state, guess(index), ctx(actor)) : voted;
};

describe('starting a match', () => {
  const lobby = createLobby(HOST, { id: 'pt-BR', customWords: [] }, ROSTER);

  it('deals a board and gives the first turn to the team with 9 cards', () => {
    const state = ok(applyAction(lobby, { type: 'start' }, ctx(HOST, true, seededRng(5))));
    expect(state.phase).toBe('clue');
    expect(state.turn).toBe(state.startingTeam);
    expect(state.key.filter((color) => color === state.startingTeam)).toHaveLength(9);
    expect(state.revealed).toEqual(Array(25).fill(false));
    expect(state.matchId).toMatch(/^[a-z2-9]{12}$/);
  });

  it('three matches in a row never repeat a word; the memory keeps the last 75', () => {
    let state = lobby;
    const boards: string[][] = [];
    for (let match = 0; match < 4; match += 1) {
      state = ok(applyAction(state, { type: 'start' }, ctx(HOST, true, seededRng(match))));
      boards.push(state.words);
      state = ok(applyAction(state, { type: 'abort' }, ctx(HOST, true)));
    }
    expect(new Set(boards.slice(0, 3).flat()).size).toBe(75);
    // The 4th board avoided the three before it too.
    expect(new Set(boards.slice(1, 4).flat()).size).toBe(75);
    expect(state.recentWords).toEqual(boards.slice(1, 4).flat());
    // Going back to the lobby keeps the memory; a new game starts without it.
    expect(ok(applyAction(state, { type: 'backToLobby' }, ctx(HOST, true))).recentWords).toHaveLength(75);
    expect(createLobby(HOST, lobby.wordList, ROSTER).recentWords).toEqual([]);
  });

  it('only moderators can start', () => {
    expect(errorOf(applyAction(lobby, { type: 'start' }, ctx('w_red1')))).toBe('notModerator');
  });

  it('needs exactly one spymaster and at least one agent per team', () => {
    const noBlueAgent = createLobby(HOST, lobby.wordList, {
      ...ROSTER, w_blue1: { team: 'blue', role: 'spymaster' },
    });
    expect(errorOf(applyAction(noBlueAgent, { type: 'start' }, ctx(HOST, true)))).toBe('teamsNotReady');
    const noSpymaster = createLobby(HOST, lobby.wordList, {
      w_red1: { team: 'red', role: 'agent' }, w_blue1: { team: 'blue', role: 'agent' },
    });
    expect(errorOf(applyAction(noSpymaster, { type: 'start' }, ctx(HOST, true)))).toBe('teamsNotReady');
  });

  it('refuses a custom list with fewer than 25 words', () => {
    const small = createLobby(HOST, { id: 'custom', customWords: ['a', 'b'] }, ROSTER);
    expect(errorOf(applyAction(small, { type: 'start' }, ctx(HOST, true)))).toBe('notEnoughWords');
  });

  const teamOf = (roster: typeof ROSTER) => Object.fromEntries(
    Object.entries(roster).map(([userId, seat]) => [userId, seat.team]),
  );

  it('a new match keeps the teams and draws a new spymaster from the agents', () => {
    const roster = {
      ...ROSTER,
      [HOST]: undefined,
      w_red0: { team: 'red' as const, role: 'spymaster' as const },
      w_blue2: { team: 'blue' as const, role: 'agent' as const },
    };
    delete roster[HOST];
    const ended = playingState({
      roster: roster as typeof ROSTER, phase: 'ended', winner: 'red', endReason: 'allFound',
    });
    for (let seed = 0; seed < 20; seed += 1) {
      const next = ok(applyAction(ended, { type: 'start' }, ctx(HOST, true, seededRng(seed))));
      expect(teamOf(next.roster)).toEqual(teamOf(ended.roster));
      expect(next.roster.w_red0.role).toBe('agent');
      expect(next.roster.w_blue0.role).toBe('agent');
      expect(Object.values(next.roster).filter((s) => s.role === 'spymaster')).toHaveLength(2);
      expect(next.phase).toBe('clue');
      expect(next.matchId).not.toBe('match1');
      expect(next.history).toEqual([]);
    }
  });

  it('the host spymaster rotates like anyone else and becomes an agent', () => {
    const ended = playingState({ phase: 'ended', winner: 'red', endReason: 'allFound' });
    const next = ok(applyAction(ended, { type: 'start' }, ctx(HOST, true)));
    expect(next.roster[HOST]).toEqual({ team: 'red', role: 'agent' });
    expect(next.roster.w_blue0).toEqual({ team: 'blue', role: 'agent' });
    expect(next.roster.w_blue1).toEqual({ team: 'blue', role: 'spymaster' });
  });

  it('prefers agents who are in the meeting', () => {
    const ended = playingState({ phase: 'ended', winner: 'red', endReason: 'allFound' });
    const roster = { ...ended.roster, w_blue2: { team: 'blue' as const, role: 'agent' as const } };
    const present = new Set([HOST, 'w_red1', 'w_red2', 'w_blue0', 'w_blue2']);
    for (let seed = 0; seed < 10; seed += 1) {
      const context = { ...ctx(HOST, true, seededRng(seed)), presentUserIds: present };
      const next = ok(applyAction({ ...ended, roster }, { type: 'start' }, context));
      expect(next.roster.w_blue2.role).toBe('spymaster');
    }
  });

  it('the starting team alternates from one match to the next', () => {
    const fresh = createLobby(HOST, { id: 'pt-BR', customWords: [] }, ROSTER);
    const matches = [ok(applyAction(fresh, { type: 'start' }, ctx(HOST, true, seededRng(1))))];
    for (let i = 0; i < 4; i += 1) {
      const aborted = ok(applyAction(matches[i], { type: 'abort' }, ctx(HOST, true)));
      matches.push(ok(applyAction(aborted, { type: 'start' }, ctx(HOST, true, seededRng(i + 7)))));
    }
    matches.forEach((match) => {
      expect(match.turn).toBe(match.startingTeam);
      expect(match.key.filter((c) => c === match.startingTeam)).toHaveLength(9);
    });
    const starters = matches.map((match) => match.startingTeam);
    const first = starters[0];
    const second = first === 'red' ? 'blue' : 'red';
    expect(starters).toEqual([first, second, first, second, first]);
  });

  it('going back to the lobby keeps the alternation but not the spymaster draw', () => {
    const ended = playingState({
      phase: 'ended', winner: 'red', endReason: 'allFound', lastStartingTeam: 'red',
    });
    const back = ok(applyAction(ended, { type: 'backToLobby' }, ctx(HOST, true)));
    const next = ok(applyAction(back, { type: 'start' }, ctx(HOST, true)));
    expect(next.startingTeam).toBe('blue');
    expect(next.roster).toEqual(ROSTER);
  });
});

describe('clues', () => {
  it('only the spymaster of the team in turn can give a clue', () => {
    const state = playingState();
    expect(errorOf(applyAction(state, clue('oceano', 2), ctx('w_blue0')))).toBe('notYourTurn');
    expect(errorOf(applyAction(state, clue('oceano', 2), ctx('w_red1')))).toBe('notYourTurn');
    expect(errorOf(applyAction(state, clue('oceano', 2), ctx('w_guest')))).toBe('notYourTurn');
    const after = ok(applyAction(state, clue('oceano', 2), ctx(HOST)));
    expect(after.phase).toBe('guess');
    expect(after.clue).toEqual({ team: 'red', word: 'oceano', count: 2 });
    expect(after.history.at(-1)).toMatchObject({ type: 'clue', word: 'oceano', by: HOST });
  });

  it('rejects a clue matching a visible word, ignoring case and accents', () => {
    const result = applyAction(playingState(), clue('PAO', 1), ctx(HOST));
    expect(result).toEqual({ ok: false, error: 'clueMatchesBoard', detail: 'pão' });
    expect(errorOf(applyAction(playingState(), clue('Gatos', 1), ctx(HOST)))).toBe('clueMatchesBoard');
  });

  it('accepts a board word once its card is revealed', () => {
    const revealed = Array(25).fill(false);
    revealed[4] = true; // pão
    expect(applyAction(playingState({ revealed }), clue('pão', 1), ctx(HOST)).ok).toBe(true);
  });

  it('rejects invalid clues', () => {
    expect(errorOf(applyAction(playingState(), clue('dois termos', 1), ctx(HOST)))).toBe('clueNotOneWord');
    expect(errorOf(applyAction(playingState(), clue('oceano', 10), ctx(HOST)))).toBe('invalidClueCount');
  });

  it('cannot give a clue while the team is guessing', () => {
    const guessing = play(playingState(), [[HOST, clue('oceano', 2)]]);
    expect(errorOf(applyAction(guessing, clue('outra', 1), ctx(HOST)))).toBe('wrongPhase');
  });
});

describe('guessing', () => {
  const guessing = (count: number | 'unlimited' = 2) => play(playingState(), [[HOST, clue('oceano', count)]]);

  it('only agents of the team in turn can reveal, and only while guessing', () => {
    expect(errorOf(reveal(playingState(), RED, 'w_red1'))).toBe('wrongPhase');
    expect(errorOf(reveal(guessing(), RED, 'w_blue1'))).toBe('notYourTurn');
    expect(errorOf(reveal(guessing(), RED, HOST))).toBe('notYourTurn');
    expect(errorOf(reveal(guessing(), RED, 'w_spectator'))).toBe('notYourTurn');
  });

  it('a correct guess keeps the turn and spends a guess', () => {
    const state = ok(reveal(guessing(2), RED, 'w_red1'));
    expect(state.revealed[RED]).toBe(true);
    expect(state.turn).toBe('red');
    expect(state.phase).toBe('guess');
    expect(state.guessesLeft).toBe(2);
    expect(state.history.at(-1)).toMatchObject({ type: 'reveal', color: 'red', by: 'w_red1' });
  });

  it('allows at most the clue number plus one guesses', () => {
    let state = guessing(2);
    expect(state.guessesLeft).toBe(3);
    state = play(state, [...pick('w_red1', 0), ...pick('w_red2', 1)]);
    expect(state.turn).toBe('red');
    state = play(state, [...pick('w_red1', 2)]);
    // The third correct guess (2 + 1) used the last one: the turn passes.
    expect(state.turn).toBe('blue');
    expect(state.phase).toBe('clue');
    expect(state.revealed.filter(Boolean)).toHaveLength(3);
  });

  it('0 and unlimited allow guessing until a miss', () => {
    [0, 'unlimited' as const].forEach((count) => {
      let state = guessing(count);
      expect(state.guessesLeft).toBeNull();
      for (let i = 0; i < 5; i += 1) state = play(state, [...pick('w_red1', i)]);
      expect(state.turn).toBe('red');
      expect(state.phase).toBe('guess');
    });
  });

  it('a neutral card ends the turn', () => {
    const state = ok(reveal(guessing(), NEUTRAL, 'w_red1'));
    expect(state.turn).toBe('blue');
    expect(state.phase).toBe('clue');
    expect(state.clue).toBeNull();
    expect(state.winner).toBeNull();
  });

  it("an opponent's card counts for the opponent and ends the turn", () => {
    const state = ok(reveal(guessing(), BLUE, 'w_red1'));
    expect(state.revealed[BLUE]).toBe(true);
    expect(state.key[BLUE]).toBe('blue');
    expect(state.key.filter((c, i) => c === 'blue' && !state.revealed[i])).toHaveLength(7);
    expect(state.turn).toBe('blue');
  });

  it('the assassin makes the revealing team lose immediately', () => {
    const state = ok(reveal(guessing(), ASSASSIN, 'w_red1'));
    expect(state.phase).toBe('ended');
    expect(state.winner).toBe('blue');
    expect(state.endReason).toBe('assassin');
    expect(state.history.at(-1)).toEqual({ type: 'end', winner: 'blue', reason: 'assassin' });
  });

  it('a team wins when all its cards are revealed', () => {
    const revealed = Array(25).fill(false);
    for (let i = 0; i < 8; i += 1) revealed[i] = true;
    const state = play(playingState({ revealed }), [[HOST, clue('oceano', 1)], ...pick('w_red1', 8)]);
    expect(state.phase).toBe('ended');
    expect(state.winner).toBe('red');
    expect(state.endReason).toBe('allFound');
  });

  it("revealing the opponent's last card makes the opponent win", () => {
    const revealed = Array(25).fill(false);
    for (let i = BLUE; i < BLUE + 7; i += 1) revealed[i] = true;
    const state = play(playingState({ revealed }), [[HOST, clue('oceano', 1)], ...pick('w_red1', 16)]);
    expect(state.winner).toBe('blue');
    expect(state.endReason).toBe('allFound');
  });

  it('cannot reveal a card twice or a card off the board', () => {
    const state = play(guessing(), [...pick('w_red1', RED)]);
    expect(errorOf(reveal(state, RED, 'w_red2'))).toBe('cardAlreadyRevealed');
    expect(errorOf(reveal(state, 25, 'w_red2'))).toBe('invalidCard');
    expect(errorOf(reveal(state, -1, 'w_red2'))).toBe('invalidCard');
  });
});

describe('voting', () => {
  const guessing = () => play(playingState(), [[HOST, clue('oceano', 2)]]);

  it('only agents of the team in turn vote, only while guessing, only on face-down cards', () => {
    expect(errorOf(applyAction(playingState(), vote(RED), ctx('w_red1')))).toBe('wrongPhase');
    expect(errorOf(applyAction(guessing(), vote(RED), ctx('w_blue1')))).toBe('notYourTurn');
    expect(errorOf(applyAction(guessing(), vote(RED), ctx(HOST)))).toBe('notYourTurn');
    expect(errorOf(applyAction(guessing(), vote(25), ctx('w_red1')))).toBe('invalidCard');
    const revealed = play(guessing(), [...pick('w_red1', RED)]);
    expect(errorOf(applyAction(revealed, vote(RED), ctx('w_red2')))).toBe('cardAlreadyRevealed');
  });

  it('an agent votes for several cards, once each, and can take a vote back', () => {
    let state = play(guessing(), [['w_red1', vote(1)], ['w_red1', vote(2)], ['w_red1', vote(1)]]);
    expect(state.votes).toEqual([{ userId: 'w_red1', index: 1 }, { userId: 'w_red1', index: 2 }]);
    state = play(state, [['w_red1', vote(1, false)]]);
    expect(state.votes).toEqual([{ userId: 'w_red1', index: 2 }]);
  });

  it('guess reveals the most voted card; a tie goes to the card voted first', () => {
    let state = play(guessing(), [
      ['w_red1', vote(NEUTRAL)], ['w_red2', vote(RED)], ['w_red1', vote(RED)],
    ]);
    expect(tallyVotes(state.votes, state.roster, 'red', () => false)).toEqual([
      { index: RED, voters: ['w_red2', 'w_red1'] },
      { index: NEUTRAL, voters: ['w_red1'] },
    ]);
    expect(errorOf(applyAction(state, guess(NEUTRAL), ctx('w_red2')))).toBe('votesChanged');
    state = ok(applyAction(state, guess(RED), ctx('w_red2')));
    expect(state.revealed[RED]).toBe(true);
    expect(state.history.at(-1)).toMatchObject({ type: 'reveal', index: RED, by: 'w_red2' });

    const tied = play(guessing(), [['w_red1', vote(BLUE)], ['w_red2', vote(RED)]]);
    expect(errorOf(applyAction(tied, guess(RED), ctx('w_red1')))).toBe('votesChanged');
    expect(ok(applyAction(tied, guess(BLUE), ctx('w_red1'))).revealed[BLUE]).toBe(true);
  });

  it('guessing needs a vote', () => {
    expect(errorOf(applyAction(guessing(), guess(RED), ctx('w_red1')))).toBe('noVotes');
  });

  it('after a correct guess the other votes stay; when the turn ends they are cleared', () => {
    let state = play(guessing(), [['w_red1', vote(RED)], ['w_red2', vote(RED)], ['w_red2', vote(NEUTRAL)]]);
    state = play(state, [['w_red1', guess(RED)]]);
    expect(state.votes).toEqual([{ userId: 'w_red2', index: NEUTRAL }]);
    state = play(state, [['w_red1', guess(NEUTRAL)]]);
    expect(state.turn).toBe('blue');
    expect(state.votes).toEqual([]);
  });

  it('a player moved by a moderator loses their votes', () => {
    const roster = { ...ROSTER, w_red3: { team: 'red' as const, role: 'agent' as const } };
    let state = play(playingState({ roster }), [
      [HOST, clue('oceano', 2)], ['w_red1', vote(RED)], ['w_red3', vote(NEUTRAL)],
    ]);
    state = ok(applyAction(state, {
      type: 'assign', userId: 'w_red3', seat: { team: 'blue', role: 'agent' },
    }, ctx(HOST, true)));
    expect(state.votes).toEqual([{ userId: 'w_red1', index: RED }]);
  });
});

describe('turns', () => {
  it('alternate between the teams', () => {
    let state = playingState();
    expect(state.turn).toBe('red');
    state = play(state, [[HOST, clue('oceano', 1)], ...pick('w_red1', NEUTRAL)]);
    expect(state.turn).toBe('blue');
    state = play(state, [['w_blue0', clue('floresta', 1)], ...pick('w_blue1', NEUTRAL + 1)]);
    expect(state.turn).toBe('red');
    expect(state.history.map((event) => event.type)).toEqual(['clue', 'reveal', 'clue', 'reveal']);
  });

  it('agents may end the turn only after the first guess', () => {
    let state = play(playingState(), [[HOST, clue('oceano', 2)]]);
    expect(errorOf(applyAction(state, { type: 'endTurn' }, ctx('w_red1')))).toBe('mustGuessFirst');
    state = play(state, [...pick('w_red1', RED)]);
    expect(errorOf(applyAction(state, { type: 'endTurn' }, ctx('w_blue1')))).toBe('notYourTurn');
    state = ok(applyAction(state, { type: 'endTurn' }, ctx('w_red2')));
    expect(state.turn).toBe('blue');
    expect(state.phase).toBe('clue');
    expect(state.history.at(-1)).toEqual({ type: 'pass', team: 'red', by: 'w_red2' });
  });
});

describe('versions and concurrent actions', () => {
  it('every applied action increments the version; rejected ones do not', () => {
    const state = playingState();
    expect(ok(applyAction(state, clue('oceano', 1), ctx(HOST))).version).toBe(11);
    expect(applyAction(state, clue('pão', 1), ctx(HOST)).ok).toBe(false);
  });

  it('two agents guessing at once: only the first reveal applies', () => {
    const state = play(playingState(), [[HOST, clue('oceano', 2)], ['w_red1', vote(RED)]]);
    const intent = { action: guess(RED), baseVersion: state.version };
    const afterFirst = ok(applyIntent(state, intent, ctx('w_red1')));
    expect(afterFirst.revealed[RED]).toBe(true);
    // The second guess names the same card, now revealed: it is not the top of the list anymore.
    expect(errorOf(applyIntent(afterFirst, intent, ctx('w_red2')))).toBe('noVotes');
  });

  it('votes and guesses based on an older version still apply', () => {
    const state = play(playingState(), [[HOST, clue('oceano', 2)]]);
    const old = state.version;
    const voted = ok(applyIntent(state, { action: vote(RED), baseVersion: old }, ctx('w_red1')));
    const both = ok(applyIntent(voted, { action: vote(RED), baseVersion: old }, ctx('w_red2')));
    const guessed = ok(applyIntent(both, { action: guess(RED), baseVersion: old }, ctx('w_red2')));
    expect(guessed.revealed[RED]).toBe(true);
    const ended = ok(applyIntent(guessed, { action: { type: 'endTurn' }, baseVersion: old }, ctx('w_red1')));
    expect(ended.turn).toBe('blue');
  });

  it('a replayed clue is dropped once applied', () => {
    const state = playingState();
    const intent = { action: clue('oceano', 2), baseVersion: state.version };
    const after = ok(applyIntent(state, intent, ctx(HOST)));
    expect(errorOf(applyIntent(after, intent, ctx(HOST)))).toBe('stale');
  });

  it('lobby actions are not versioned', () => {
    const lobby = createLobby(HOST, { id: 'pt-BR', customWords: [] });
    const result = applyIntent(lobby, { action: { type: 'leave' }, baseVersion: -5 }, ctx('w_x'));
    expect(result.ok).toBe(true);
  });
});

describe('moderator actions', () => {
  it('abort ends the match without a winner; back to lobby keeps the teams', () => {
    const aborted = ok(applyAction(playingState(), { type: 'abort' }, ctx(HOST, true)));
    expect(aborted).toMatchObject({ phase: 'ended', winner: null, endReason: 'aborted' });
    const lobby = ok(applyAction(aborted, { type: 'backToLobby' }, ctx(HOST, true)));
    expect(lobby).toMatchObject({
      phase: 'lobby', words: [], key: [], roster: ROSTER,
    });
    expect(errorOf(applyAction(playingState(), { type: 'abort' }, ctx('w_red1')))).toBe('notModerator');
  });

  it('assigning a spymaster moves the previous one to agent', () => {
    const state = ok(applyAction(playingState(), {
      type: 'assign', userId: 'w_red1', seat: { team: 'red', role: 'spymaster' },
    }, ctx('w_mod', true)));
    expect(state.roster.w_red1).toEqual({ team: 'red', role: 'spymaster' });
    expect(state.roster[HOST]).toEqual({ team: 'red', role: 'agent' });
    const blue = ok(applyAction(playingState(), {
      type: 'assign', userId: 'w_blue1', seat: { team: 'blue', role: 'spymaster' },
    }, ctx(HOST, true)));
    expect(blue.roster.w_blue0).toEqual({ team: 'blue', role: 'agent' });
  });

  it('a match in progress keeps playable teams', () => {
    const result = applyAction(playingState(), { type: 'assign', userId: 'w_blue1', seat: null }, ctx(HOST, true));
    expect(errorOf(result)).toBe('teamNeedsAgent');
    const added = applyAction(playingState(), {
      type: 'assign', userId: 'w_late', seat: { team: 'blue', role: 'agent' },
    }, ctx(HOST, true));
    expect(ok(added).roster.w_late).toEqual({ team: 'blue', role: 'agent' });
  });

  it('the host may be an agent like anyone else', () => {
    const drawn = createLobby(HOST, { id: 'pt-BR', customWords: [] }, ROSTER);
    expect(ok(applyAction(drawn, { type: 'releaseSpymaster' }, ctx(HOST, true))).roster[HOST])
      .toEqual({ team: 'red', role: 'agent' });
  });

  const meeting = (...ids: string[]) => new Set(ids);
  const draw = (state: GameState, present: Set<string> | null, seed = 1) => applyAction(
    state,
    { type: 'shuffleTeams' },
    { ...ctx(HOST, true, seededRng(seed)), presentUserIds: present },
  );

  it('draws balanced teams among everyone in the meeting, the host included, all agents', () => {
    const lobby = createLobby(HOST, { id: 'pt-BR', customWords: [] });
    const present = meeting(HOST, 'w_a', 'w_b', 'w_c', 'w_d', 'w_e');
    const teamsOfHost = new Set<string>();
    for (let seed = 0; seed < 20; seed += 1) {
      const state = ok(draw(lobby, present, seed));
      const seats = Object.values(state.roster);
      expect(Object.keys(state.roster).sort()).toEqual([...present].sort());
      expect(seats.filter((seat) => seat.team === 'red')).toHaveLength(3);
      // Each team picks its spymaster after the draw.
      expect(seats.every((seat) => seat.role === 'agent')).toBe(true);
      teamsOfHost.add(state.roster[HOST].team);
    }
    expect(teamsOfHost).toEqual(new Set(['red', 'blue']));
  });

  it('who left the meeting is not drawn; with the user list unknown, the seated players are', () => {
    const lobby = createLobby(HOST, { id: 'pt-BR', customWords: [] }, ROSTER);
    const state = ok(draw(lobby, meeting(HOST, 'w_red1', 'w_red2', 'w_blue1', 'w_new')));
    expect(state.roster.w_blue0).toBeUndefined();
    expect(state.roster.w_new).toBeDefined();
    expect(Object.keys(ok(draw(lobby, null)).roster).sort()).toEqual(Object.keys(ROSTER).sort());
  });

  it('the draw needs four participants and is moderator-only', () => {
    const lobby = createLobby(HOST, { id: 'pt-BR', customWords: [] });
    expect(errorOf(draw(lobby, meeting(HOST, 'w_a', 'w_b')))).toBe('notEnoughPlayers');
    expect(ok(draw(lobby, meeting(HOST, 'w_a', 'w_b', 'w_c'))).roster[HOST]).toBeDefined();
    expect(errorOf(applyAction(lobby, { type: 'shuffleTeams' }, ctx('w_a')))).toBe('notModerator');
  });

  it('a player can leave the team between matches', () => {
    const lobby = createLobby(HOST, { id: 'pt-BR', customWords: [] }, ROSTER);
    expect(ok(applyAction(lobby, { type: 'leave' }, ctx('w_red1'))).roster.w_red1).toBeUndefined();
    expect(errorOf(applyAction(playingState(), { type: 'leave' }, ctx('w_red1')))).toBe('wrongPhase');
  });
});

describe('choosing the spymaster', () => {
  const allAgents = createLobby(HOST, { id: 'pt-BR', customWords: [] }, {
    w_red1: { team: 'red', role: 'agent' },
    w_red2: { team: 'red', role: 'agent' },
    w_blue1: { team: 'blue', role: 'agent' },
  });

  it('the first player of the team to offer gets the seat', () => {
    const state = ok(applyAction(allAgents, { type: 'claimSpymaster' }, ctx('w_red2')));
    expect(state.roster.w_red2).toEqual({ team: 'red', role: 'spymaster' });
    expect(errorOf(applyAction(state, { type: 'claimSpymaster' }, ctx('w_red1')))).toBe('spymasterTaken');
    // The other team's seat is still free.
    expect(ok(applyAction(state, { type: 'claimSpymaster' }, ctx('w_blue1'))).roster.w_blue1.role)
      .toBe('spymaster');
  });

  it('the spymaster can step down, which frees the seat', () => {
    let state = ok(applyAction(allAgents, { type: 'claimSpymaster' }, ctx('w_red2')));
    state = ok(applyAction(state, { type: 'releaseSpymaster' }, ctx('w_red2')));
    expect(state.roster.w_red2).toEqual({ team: 'red', role: 'agent' });
    expect(ok(applyAction(state, { type: 'claimSpymaster' }, ctx('w_red1'))).roster.w_red1.role)
      .toBe('spymaster');
  });

  it('only seated players, only between matches', () => {
    expect(errorOf(applyAction(allAgents, { type: 'claimSpymaster' }, ctx('w_viewer')))).toBe('notInTeam');
    expect(errorOf(applyAction(playingState(), { type: 'claimSpymaster' }, ctx('w_red1')))).toBe('wrongPhase');
    expect(errorOf(applyAction(playingState(), { type: 'releaseSpymaster' }, ctx('w_blue0')))).toBe('wrongPhase');
  });
});
