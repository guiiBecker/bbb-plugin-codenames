import { describe, expect, it } from 'vitest';
import { applyAction } from '../../src/game/reducer';
import {
  canEndTurn, canGiveClue, canGuess, remainingCards, restoreGameState, toPublicGame, visibleWords,
  voteTally,
} from '../../src/game/view';
import {
  ASSASSIN, BLUE, HOST, KEY, NEUTRAL, ctx, playingState,
} from './helpers/game';

describe('toPublicGame', () => {
  it('never carries the color of a hidden card', () => {
    const game = toPublicGame(playingState());
    expect(game.key).toBeNull();
    expect(game.revealed).toEqual(Array(25).fill(null));
    const json = JSON.stringify(game);
    ['assassin', 'neutral'].forEach((color) => expect(json).not.toContain(color));
  });

  it('carries a card color once it is revealed', () => {
    const revealed = Array(25).fill(false);
    revealed[BLUE] = true;
    const game = toPublicGame(playingState({ revealed }));
    expect(game.revealed[BLUE]).toBe('blue');
    expect(game.revealed.filter((color) => color !== null)).toHaveLength(1);
    expect(JSON.stringify(game)).not.toContain('assassin');
  });

  it('reveals the whole key map once the match ended', () => {
    const result = applyAction(
      playingState({
        phase: 'guess',
        clue: { team: 'red', word: 'x', count: 1 },
        guessesLeft: 2,
        votes: [{ userId: 'w_red1', index: ASSASSIN }],
      }),
      { type: 'guess', index: ASSASSIN },
      ctx('w_red1'),
    );
    if (!result.ok) throw new Error(result.error);
    expect(toPublicGame(result.state).key).toEqual(KEY);
  });
});

describe('voteTally', () => {
  it('counts only the guessing team agents, on face-down cards, most voted first', () => {
    const revealed = Array(25).fill(false);
    revealed[BLUE] = true;
    const game = toPublicGame(playingState({
      phase: 'guess',
      clue: { team: 'red', word: 'x', count: 1 },
      revealed,
      votes: [
        { userId: 'w_red1', index: NEUTRAL },
        { userId: 'w_red1', index: 3 },
        { userId: 'w_red2', index: 3 },
        { userId: 'w_blue1', index: NEUTRAL },
        { userId: 'w_red2', index: BLUE },
      ],
    }));
    expect(voteTally(game)).toEqual([
      { index: 3, voters: ['w_red1', 'w_red2'] },
      { index: NEUTRAL, voters: ['w_red1'] },
    ]);
    expect(voteTally({ ...game, phase: 'clue' })).toEqual([]);
  });
});

describe('restoreGameState', () => {
  it('keeps the votes across a host reload', () => {
    const state = playingState({
      phase: 'guess',
      clue: { team: 'red', word: 'x', count: 1 },
      votes: [{ userId: 'w_red1', index: 3 }],
    });
    expect(restoreGameState(toPublicGame(state), KEY)).toEqual(state);
  });

  it('rebuilds the full state from the public state and the key', () => {
    const state = playingState({ revealed: KEY.map((_, i) => i === NEUTRAL) });
    expect(restoreGameState(toPublicGame(state), KEY)).toEqual(state);
  });

  it('refuses a missing key or one contradicting a revealed card', () => {
    const state = playingState({ revealed: KEY.map((_, i) => i === NEUTRAL) });
    expect(restoreGameState(toPublicGame(state), null)).toBeNull();
    const wrong = [...KEY];
    wrong[NEUTRAL] = 'red';
    wrong[0] = 'neutral';
    expect(restoreGameState(toPublicGame(state), wrong)).toBeNull();
  });

  it('a lobby needs no key', () => {
    const lobby = {
      ...playingState(), phase: 'lobby' as const, words: [], key: [], revealed: [],
    };
    expect(restoreGameState(toPublicGame(lobby), null)).toEqual(lobby);
  });
});

describe('viewer helpers', () => {
  it('counts the cards each team still has to find from public data', () => {
    const revealed = Array(25).fill(false);
    revealed[0] = true;
    revealed[BLUE] = true;
    revealed[BLUE + 1] = true;
    expect(remainingCards(toPublicGame(playingState({ revealed })))).toEqual({ red: 8, blue: 6 });
  });

  it('tells who may give a clue, guess and end the turn', () => {
    const clue = toPublicGame(playingState());
    expect(canGiveClue(clue, HOST)).toBe(true);
    expect(canGiveClue(clue, 'w_blue0')).toBe(false);
    expect(canGuess(clue, 'w_red1')).toBe(false);
    const guess = toPublicGame(playingState({ phase: 'guess', guessesMade: 0 }));
    expect(canGuess(guess, 'w_red1')).toBe(true);
    expect(canGuess(guess, 'w_blue1')).toBe(false);
    expect(canEndTurn(guess, 'w_red1')).toBe(false);
    expect(canEndTurn({ ...guess, guessesMade: 1 }, 'w_red1')).toBe(true);
    expect(canGuess(guess, null)).toBe(false);
  });

  it('visibleWords leaves out revealed cards', () => {
    const revealed = Array(25).fill(false);
    revealed[0] = true;
    expect(visibleWords(toPublicGame(playingState({ revealed })))).toHaveLength(24);
  });
});
