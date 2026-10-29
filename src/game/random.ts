import { MATCH_ID_ALPHABET, MATCH_ID_LENGTH } from './constants';
import { Rng } from './types';

/** Cryptographically strong rng: the board and the key map must not be predictable. */
export const cryptoRng: Rng = () => {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
};

/** An integer in [0, max). */
export const randomInt = (max: number, rng: Rng): number => Math.floor(rng() * max);

/** Fisher–Yates; returns a new array. */
export const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1, rng);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const randomId = (rng: Rng, length = MATCH_ID_LENGTH): string => Array.from(
  { length },
  () => MATCH_ID_ALPHABET[randomInt(MATCH_ID_ALPHABET.length, rng)],
).join('');
