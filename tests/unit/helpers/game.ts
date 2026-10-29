import { createLobby } from '../../../src/game/reducer';
import {
  ActionContext, CardColor, GameState, Rng, Roster,
} from '../../../src/game/types';
import { resolveWordPool } from '../../../src/words/service';

/** Deterministic rng (mulberry32), so failures reproduce. */
export const seededRng = (seed: number): Rng => {
  let a = seed >>> 0; // eslint-disable-line no-bitwise
  return () => {
    /* eslint-disable no-bitwise */
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    /* eslint-enable no-bitwise */
  };
};

export const HOST = 'w_host';

/** Red: the host as spymaster, two agents. Blue: a spymaster and one agent. */
export const ROSTER: Roster = {
  [HOST]: { team: 'red', role: 'spymaster' },
  w_red1: { team: 'red', role: 'agent' },
  w_red2: { team: 'red', role: 'agent' },
  w_blue0: { team: 'blue', role: 'spymaster' },
  w_blue1: { team: 'blue', role: 'agent' },
};

/** Indices 0–8 red, 9–16 blue, 17–23 neutral, 24 the assassin. */
export const KEY: CardColor[] = [
  ...Array<CardColor>(9).fill('red'),
  ...Array<CardColor>(8).fill('blue'),
  ...Array<CardColor>(7).fill('neutral'),
  'assassin',
];

export const RED = 0;
export const BLUE = 9;
export const NEUTRAL = 17;
export const ASSASSIN = 24;

export const WORDS = [
  'mar', 'sol', 'lua', 'rei', 'pão', 'gato', 'ponte', 'banco', 'chave',
  'rede', 'faca', 'trem', 'gelo', 'vela', 'disco', 'bola', 'cobra',
  'fada', 'osso', 'piano', 'robô', 'tigre', 'vinho', 'zebra', 'bomba',
];

export const ctx = (
  actorId: string,
  actorIsModerator = false,
  rng: Rng = seededRng(1),
): ActionContext => ({
  actorId, actorIsModerator, rng, resolveWordPool,
});

/** A match in progress with the fixed key: red starts and must give a clue. */
export const playingState = (overrides: Partial<GameState> = {}): GameState => ({
  ...createLobby(HOST, { id: 'pt-BR', customWords: [] }, ROSTER),
  version: 10,
  matchId: 'match1',
  phase: 'clue',
  words: [...WORDS],
  key: [...KEY],
  revealed: Array<boolean>(25).fill(false),
  startingTeam: 'red',
  turn: 'red',
  ...overrides,
});
