import { describe, expect, it } from 'vitest';
import { ONE_WORD_PATTERN } from '../../src/game/constants';
import { foldWord } from '../../src/game/normalize';
import { MAX_WORD_LENGTH } from '../../src/words/constants';
import { EN_WORDS } from '../../src/words/en';
import { PT_BR_WORDS } from '../../src/words/pt-BR';
import {
  hasEnoughWords, parseCustomWords, resolveWordPool, sanitizeWordList,
} from '../../src/words/service';

describe.each([
  ['pt-BR', PT_BR_WORDS],
  ['en', EN_WORDS],
])('the %s list', (_, words) => {
  it('has at least 400 distinct words, accents and case ignored', () => {
    expect(new Set(words.map(foldWord)).size).toBe(words.length);
    expect(words.length).toBeGreaterThanOrEqual(400);
  });

  it('has only single, short, lower-case words', () => {
    words.forEach((word) => {
      expect(word).toMatch(ONE_WORD_PATTERN);
      expect(word.length).toBeLessThanOrEqual(MAX_WORD_LENGTH);
      expect(word).toBe(word.toLowerCase());
    });
  });
});

describe('parseCustomWords', () => {
  it('splits on lines, commas and semicolons, trims and deduplicates', () => {
    const result = parseCustomWords('Maçã\n banana ,  maca;PERA\n\n;  ');
    expect(result.words).toEqual(['Maçã', 'banana', 'PERA']);
    expect(result.duplicates).toBe(1);
  });

  it('drops words that are too long', () => {
    const result = parseCustomWords(`ok\n${'x'.repeat(MAX_WORD_LENGTH + 1)}`);
    expect(result.words).toEqual(['ok']);
    expect(result.dropped).toBe(1);
  });

  it('keeps multi-word entries such as place names', () => {
    expect(parseCustomWords('Nova York, Rio de Janeiro').words).toEqual(['Nova York', 'Rio de Janeiro']);
  });
});

describe('word list config', () => {
  it('resolves each list', () => {
    expect(resolveWordPool({ id: 'pt-BR', customWords: [] })).toContain('banco');
    expect(resolveWordPool({ id: 'en', customWords: [] })).toContain('bank');
    expect(resolveWordPool({ id: 'custom', customWords: ['a'] })).toEqual(['a']);
  });

  it('hasEnoughWords needs 25 distinct words', () => {
    expect(hasEnoughWords(Array.from({ length: 25 }, (_, i) => `w${i}`))).toBe(true);
    expect(hasEnoughWords([...Array.from({ length: 24 }, (_, i) => `w${i}`), 'W0'])).toBe(false);
  });

  it('sanitizes malformed payloads', () => {
    expect(sanitizeWordList(null)).toEqual({ id: 'pt-BR', customWords: [] });
    expect(sanitizeWordList({ id: 'xx' }, 'en')).toEqual({ id: 'en', customWords: [] });
    expect(sanitizeWordList({ id: 'custom', customWords: ['a', 3, 'a', 'b'] }))
      .toEqual({ id: 'custom', customWords: ['a', 'b'] });
    expect(sanitizeWordList({ id: 'en', customWords: ['a'] })).toEqual({ id: 'en', customWords: [] });
  });
});
