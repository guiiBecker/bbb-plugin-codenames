import { describe, expect, it } from 'vitest';
import { guessesAllowed, isValidClueCount, validateClue } from '../../src/game/clue';
import { foldWord } from '../../src/game/normalize';

const BOARD = ['Pão', 'Coração', 'Banco', 'Nova York', 'guarda-chuva'];

describe('validateClue', () => {
  it('accepts one word and a number from 1 to 9', () => {
    expect(validateClue('Oceano', 3, BOARD)).toBeNull();
    expect(validateClue('  oceano ', 9, BOARD)).toBeNull();
    expect(validateClue('arco-íris', 1, BOARD)).toBeNull();
  });

  it('accepts 0 and unlimited', () => {
    expect(validateClue('oceano', 0, BOARD)).toBeNull();
    expect(validateClue('oceano', 'unlimited', BOARD)).toBeNull();
  });

  it.each(['pão', 'PAO', 'Pao', 'coracao', 'CORAÇÃO', 'banco'])(
    'rejects %s: a visible word, ignoring case and accents',
    (clue) => {
      expect(validateClue(clue, 2, BOARD)).toEqual({ error: 'clueMatchesBoard', detail: expect.any(String) });
    },
  );

  it('rejects a part of a visible word, and a word containing one', () => {
    expect(validateClue('cora', 1, BOARD)).toMatchObject({ error: 'clueMatchesBoard', detail: 'Coração' });
    expect(validateClue('york', 1, BOARD)).toMatchObject({ error: 'clueMatchesBoard', detail: 'Nova York' });
    expect(validateClue('chuva', 1, BOARD)).toMatchObject({ error: 'clueMatchesBoard', detail: 'guarda-chuva' });
    expect(validateClue('bancos', 1, BOARD)).toMatchObject({ error: 'clueMatchesBoard', detail: 'Banco' });
  });

  it('only checks the words it is given (revealed words no longer count)', () => {
    expect(validateClue('banco', 1, ['Pão'])).toBeNull();
  });

  it('rejects more than one word, empty and too long clues', () => {
    expect(validateClue('mar azul', 2, BOARD)).toEqual({ error: 'clueNotOneWord' });
    expect(validateClue('mar,azul', 2, BOARD)).toEqual({ error: 'clueNotOneWord' });
    expect(validateClue('   ', 2, BOARD)).toEqual({ error: 'clueEmpty' });
    expect(validateClue(undefined, 2, BOARD)).toEqual({ error: 'clueEmpty' });
    expect(validateClue('a'.repeat(31), 2, BOARD)).toEqual({ error: 'clueTooLong' });
  });

  it.each([10, -1, 1.5, '3', null, 'infinite'])('rejects the count %s', (count) => {
    expect(validateClue('oceano', count, BOARD)).toEqual({ error: 'invalidClueCount' });
  });
});

describe('clue counts', () => {
  it('allows the number plus one guesses; 0 and unlimited have no limit', () => {
    expect(guessesAllowed(1)).toBe(2);
    expect(guessesAllowed(3)).toBe(4);
    expect(guessesAllowed(9)).toBe(10);
    expect(guessesAllowed(0)).toBeNull();
    expect(guessesAllowed('unlimited')).toBeNull();
  });

  it('isValidClueCount', () => {
    expect([0, 1, 9, 'unlimited'].every(isValidClueCount)).toBe(true);
    expect([10, -1, 2.5, '2'].some(isValidClueCount)).toBe(false);
  });
});

describe('foldWord', () => {
  it('drops accents, case and punctuation', () => {
    expect(foldWord('Coração')).toBe('coracao');
    expect(foldWord('Guarda-Chuva')).toBe('guardachuva');
    expect(foldWord('ÍMÃ')).toBe('ima');
  });
});
