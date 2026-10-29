import { describe, expect, it } from 'vitest';
import {
  colorTotals, generateBoard, generateKey, remainingFor,
} from '../../src/game/board';
import { BOARD_SIZE } from '../../src/game/constants';
import { foldWord } from '../../src/game/normalize';
import { randomId, shuffle } from '../../src/game/random';
import { CardColor, Team } from '../../src/game/types';
import { PT_BR_WORDS } from '../../src/words/pt-BR';
import { KEY, seededRng } from './helpers/game';

const countColors = (key: CardColor[]) => key.reduce<Record<string, number>>(
  (acc, color) => ({ ...acc, [color]: (acc[color] ?? 0) + 1 }),
  {},
);

describe('generateKey', () => {
  it.each<Team>(['red', 'blue'])('gives 9 cards to the starting team (%s), 8, 7 and 1', (team) => {
    const other = team === 'red' ? 'blue' : 'red';
    for (let seed = 0; seed < 50; seed += 1) {
      const key = generateKey(team, seededRng(seed));
      expect(key).toHaveLength(25);
      expect(countColors(key)).toEqual({
        [team]: 9, [other]: 8, neutral: 7, assassin: 1,
      });
    }
  });

  it('shuffles the colors', () => {
    const keys = new Set(
      Array.from({ length: 20 }, (_, seed) => generateKey('red', seededRng(seed)).join()),
    );
    expect(keys.size).toBe(20);
  });
});

describe('generateBoard', () => {
  it('draws 25 distinct words and a key where the starting team has 9 cards', () => {
    const board = generateBoard(PT_BR_WORDS, seededRng(7))!;
    expect(board.words).toHaveLength(BOARD_SIZE);
    expect(new Set(board.words.map(foldWord)).size).toBe(BOARD_SIZE);
    expect(countColors(board.key)[board.startingTeam]).toBe(9);
  });

  it('draws the starting team at random', () => {
    const starters = new Set(
      Array.from({ length: 30 }, (_, seed) => (
        generateBoard(PT_BR_WORDS, seededRng(seed))!.startingTeam
      )),
    );
    expect(starters).toEqual(new Set(['red', 'blue']));
  });

  it('ignores accents and case when picking distinct words', () => {
    const pool = ['Pão', 'pao', 'PÃO', ...Array.from({ length: 23 }, (_, i) => `palavra${i}`)];
    expect(generateBoard(pool, seededRng(1))).toBeNull();
    expect(generateBoard([...pool, 'extra'], seededRng(1))!.words).toHaveLength(25);
  });

  it('returns null when the pool has fewer than 25 words', () => {
    expect(generateBoard(PT_BR_WORDS.slice(0, 24), seededRng(1))).toBeNull();
  });
});

describe('helpers', () => {
  it('colorTotals follows the starting team', () => {
    expect(colorTotals('blue')).toEqual({
      blue: 9, red: 8, neutral: 7, assassin: 1,
    });
  });

  it('remainingFor counts unrevealed cards of a team', () => {
    const revealed = Array<boolean>(25).fill(false);
    revealed[0] = true;
    revealed[9] = true;
    expect(remainingFor('red', KEY, revealed)).toBe(8);
    expect(remainingFor('blue', KEY, revealed)).toBe(7);
  });

  it('shuffle keeps every item and randomId uses the alphabet', () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    expect(shuffle(items, seededRng(3)).sort((a, b) => a - b)).toEqual(items);
    expect(randomId(seededRng(3))).toMatch(/^[a-z2-9]{12}$/);
  });
});

describe('avoiding recent words', () => {
  const pool = Array.from({ length: 100 }, (_, i) => `palavra${i}`);

  it('never draws a recent word while enough others are left', () => {
    const recent = pool.slice(0, 75);
    for (let seed = 0; seed < 20; seed += 1) {
      const board = generateBoard(pool, seededRng(seed), undefined, recent)!;
      expect(board.words).toHaveLength(25);
      expect(board.words.filter((word) => recent.includes(word))).toEqual([]);
    }
  });

  it('ignores accents and case when comparing with recent words', () => {
    const small = ['Pão', ...pool.slice(0, 25)];
    const board = generateBoard(small, seededRng(1), undefined, ['PAO'])!;
    expect(board.words).not.toContain('Pão');
  });

  it('with too few fresh words, completes the board with the words used longest ago', () => {
    const custom = pool.slice(0, 30);
    // Oldest first: palavra0 … palavra29; only 5 words are fresh.
    const recent = custom.slice(0, 25);
    const words = [...custom, ...pool.slice(30, 35)];
    const board = generateBoard(words, seededRng(3), undefined, recent)!;
    const fresh = [...custom.slice(25), ...pool.slice(30, 35)];
    expect(board.words.filter((word) => fresh.includes(word))).toHaveLength(10);
    expect(board.words.filter((word) => recent.includes(word)).sort())
      .toEqual(recent.slice(0, 15).sort());
  });
});
