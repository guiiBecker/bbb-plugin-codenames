import { WordListId } from '../game/types';

export const WORD_LIST_IDS: readonly WordListId[] = ['pt-BR', 'en', 'custom'];

export const DEFAULT_WORD_LIST_ID: WordListId = 'pt-BR';

/** A custom list is capped so the public state entry stays small. */
export const MAX_CUSTOM_WORDS = 600;

export const MAX_WORD_LENGTH = 24;

/** Custom lists accept one word per line, or words separated by commas or semicolons. */
export const CUSTOM_WORDS_SEPARATOR = /[\n\r,;]+/;
