import { describe, expect, it } from 'vitest';
import { groupRounds } from '../../src/game/rounds';
import { HistoryEvent } from '../../src/game/types';

const clue = (team: 'red' | 'blue', word: string): HistoryEvent => ({
  type: 'clue', team, word, count: 1, by: `w_${team}Spy`,
});
const reveal = (team: 'red' | 'blue', word: string): HistoryEvent => ({
  type: 'reveal', team, index: 0, word, color: 'neutral', by: `w_${team}1`,
});

describe('groupRounds', () => {
  it('opens a round with every clue and puts the moves under it', () => {
    const { rounds, end } = groupRounds([
      clue('red', 'mar'), reveal('red', 'sol'), { type: 'pass', team: 'red', by: 'w_red1' },
      clue('blue', 'gelo'), reveal('blue', 'lua'),
      { type: 'end', winner: 'red', reason: 'assassin' },
    ]);
    expect(rounds.map((r) => [r.number, r.team, r.clue.word, r.moves.map((m) => m.type)])).toEqual([
      [1, 'red', 'mar', ['reveal', 'pass']],
      [2, 'blue', 'gelo', ['reveal']],
    ]);
    expect(end).toEqual({ type: 'end', winner: 'red', reason: 'assassin' });
  });

  it('an empty history has no rounds; a match ended before any clue has only the end', () => {
    expect(groupRounds([])).toEqual({ rounds: [], end: null });
    expect(groupRounds([{ type: 'end', winner: null, reason: 'aborted' }]).rounds).toEqual([]);
  });
});
