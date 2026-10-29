import { BOARD_SIZE } from '../game/constants';
import { uniqueWords } from '../game/normalize';
import { WordListConfig, WordListId } from '../game/types';
import {
  CUSTOM_WORDS_SEPARATOR, DEFAULT_WORD_LIST_ID, MAX_CUSTOM_WORDS, MAX_WORD_LENGTH, WORD_LIST_IDS,
} from './constants';
import { EN_WORDS } from './en';
import { PT_BR_WORDS } from './pt-BR';

export interface ParsedCustomWords {
  words: string[];
  /** Entries dropped for being too long, or beyond the cap. */
  dropped: number;
  /** Repeated entries (accents and case ignored). */
  duplicates: number;
}

/** Parses a pasted list: one per line or comma/semicolon separated, trimmed and deduplicated. */
export const parseCustomWords = (text: string): ParsedCustomWords => {
  const entries = text.split(CUSTOM_WORDS_SEPARATOR).map((word) => word.trim()).filter(Boolean);
  const fitting = entries.filter((word) => word.length <= MAX_WORD_LENGTH);
  const unique = uniqueWords(fitting);
  const words = unique.slice(0, MAX_CUSTOM_WORDS);
  return {
    words,
    dropped: entries.length - fitting.length + unique.length - words.length,
    duplicates: fitting.length - unique.length,
  };
};

export const hasEnoughWords = (words: readonly string[]): boolean => (
  uniqueWords(words).length >= BOARD_SIZE
);

export const isWordListId = (value: unknown): value is WordListId => (
  WORD_LIST_IDS.includes(value as WordListId)
);

export const resolveWordPool = (config: WordListConfig): string[] => {
  switch (config.id) {
    case 'en': return [...EN_WORDS];
    case 'custom': return config.customWords;
    default: return [...PT_BR_WORDS];
  }
};

/** Payload sanitizer: anything malformed falls back to the default list. */
export const sanitizeWordList = (
  value: unknown,
  fallback = DEFAULT_WORD_LIST_ID,
): WordListConfig => {
  const raw = value as Partial<WordListConfig> | null | undefined;
  const id = isWordListId(raw?.id) ? raw!.id : fallback;
  const customWords = id === 'custom' && Array.isArray(raw?.customWords)
    ? parseCustomWords(raw!.customWords.filter((word) => typeof word === 'string').join('\n')).words
    : [];
  return { id, customWords };
};
