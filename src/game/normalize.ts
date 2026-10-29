/**
 * Folds a word for comparison: no accents, no case, and only letters and digits, so
 * "Pão", "PAO" and "pão-" all compare equal.
 */
export const foldWord = (word: string): string => word
  .normalize('NFD')
  .replace(/\p{M}+/gu, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

/** Unique words (by their folded form), trimmed, in their original order. */
export const uniqueWords = (words: readonly string[]): string[] => {
  const seen = new Set<string>();
  return words.reduce<string[]>((result, raw) => {
    const word = raw.trim().replace(/\s+/g, ' ');
    const folded = foldWord(word);
    if (!folded || seen.has(folded)) return result;
    seen.add(folded);
    result.push(word);
    return result;
  }, []);
};
