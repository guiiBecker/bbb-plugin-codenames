import { BOARD_SIZE, CARD_COUNTS, CARD_COLORS } from './constants';
import { foldWord, uniqueWords } from './normalize';
import { randomInt, shuffle } from './random';
import { CardColor, Rng, Team } from './types';

export interface Board {
  words: string[];
  key: CardColor[];
  startingTeam: Team;
}

export const otherTeam = (team: Team): Team => (team === 'red' ? 'blue' : 'red');

/** How many cards of each color a board has, given the starting team. */
export const colorTotals = (startingTeam: Team): Record<CardColor, number> => ({
  [startingTeam]: CARD_COUNTS.startingTeam,
  [otherTeam(startingTeam)]: CARD_COUNTS.otherTeam,
  neutral: CARD_COUNTS.neutral,
  assassin: CARD_COUNTS.assassin,
}) as Record<CardColor, number>;

/** A shuffled key map: 9 cards for the starting team, 8 for the other, 7 neutral, 1 assassin. */
export const generateKey = (startingTeam: Team, rng: Rng): CardColor[] => {
  const totals = colorTotals(startingTeam);
  const colors = CARD_COLORS.flatMap((color) => Array<CardColor>(totals[color]).fill(color));
  return shuffle(colors, rng);
};

/**
 * Picks the board's 25 words: at random among the words not used recently. When the pool has
 * too few of those (a short custom list), the board is completed with the words used longest
 * ago. `recent` goes from oldest to newest.
 */
const drawWords = (candidates: string[], recent: readonly string[], rng: Rng): string[] => {
  const recentOrder = new Map(recent.map((word, index) => [foldWord(word), index]));
  const fresh = candidates.filter((word) => !recentOrder.has(foldWord(word)));
  if (fresh.length >= BOARD_SIZE) return shuffle(fresh, rng).slice(0, BOARD_SIZE);
  const oldestFirst = candidates
    .filter((word) => recentOrder.has(foldWord(word)))
    .sort((a, b) => recentOrder.get(foldWord(a))! - recentOrder.get(foldWord(b))!);
  return shuffle([...fresh, ...oldestFirst.slice(0, BOARD_SIZE - fresh.length)], rng);
};

/**
 * Draws 25 distinct words (accents and case ignored), avoiding the `recent` ones, and a key map.
 * The starting team, drawn at random unless given, always has 9 cards. Returns null when the
 * pool is too small.
 */
export const generateBoard = (
  pool: readonly string[],
  rng: Rng,
  startingTeamOverride?: Team,
  recent: readonly string[] = [],
): Board | null => {
  const candidates = uniqueWords(pool);
  if (candidates.length < BOARD_SIZE) return null;
  const startingTeam: Team = startingTeamOverride ?? (randomInt(2, rng) === 0 ? 'red' : 'blue');
  return {
    words: drawWords(candidates, recent, rng),
    key: generateKey(startingTeam, rng),
    startingTeam,
  };
};

/** Cards of a team not revealed yet. */
export const remainingFor = (
  team: Team,
  key: readonly CardColor[],
  revealed: readonly boolean[],
): number => key.filter((color, index) => color === team && !revealed[index]).length;
