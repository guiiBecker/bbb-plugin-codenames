import { CLUE_MAX_COUNT, CLUE_MAX_LENGTH, ONE_WORD_PATTERN } from './constants';
import { foldWord } from './normalize';
import { ClueCount, GameError } from './types';

export interface ClueProblem {
  error: GameError;
  /** The board word the clue collides with. */
  detail?: string;
}

export const isValidClueCount = (count: unknown): count is ClueCount => (
  count === 'unlimited'
  || (typeof count === 'number' && Number.isInteger(count) && count >= 0 && count <= CLUE_MAX_COUNT)
);

/** Guesses allowed by a clue: the number plus one; 0 and unlimited mean no limit (null). */
export const guessesAllowed = (count: ClueCount): number | null => (
  count === 'unlimited' || count === 0 ? null : count + 1
);

/**
 * A clue is one word and a number. The word may not be, contain, or be part of any word still
 * visible on the board; accents and case are ignored.
 */
export const validateClue = (
  word: unknown,
  count: unknown,
  visibleWords: readonly string[],
): ClueProblem | null => {
  if (typeof word !== 'string' || !word.trim()) return { error: 'clueEmpty' };
  const trimmed = word.trim();
  if (trimmed.length > CLUE_MAX_LENGTH) return { error: 'clueTooLong' };
  if (!ONE_WORD_PATTERN.test(trimmed)) return { error: 'clueNotOneWord' };
  if (!isValidClueCount(count)) return { error: 'invalidClueCount' };
  const folded = foldWord(trimmed);
  const conflict = visibleWords.find((visible) => {
    const boardWord = foldWord(visible);
    return !!boardWord && (boardWord.includes(folded) || folded.includes(boardWord));
  });
  return conflict ? { error: 'clueMatchesBoard', detail: conflict } : null;
};
