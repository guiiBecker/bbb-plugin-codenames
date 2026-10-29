import { describe, expect, it } from 'vitest';
import { DataChannelEntryResponseType } from 'bigbluebutton-html-plugin-sdk';
import { toPublicGame } from '../../src/game/view';
import {
  keyReceivers, parseGameState, parseIntents, parseSecretKey, sanitizeAction, sanitizePublicGame,
} from '../../src/sync/service';
import { HOST, KEY, playingState } from './helpers/game';

let clock = 0;
const entry = <T>(
  createdBy: string,
  payloadJson: T,
  entryId = `e${clock}`,
): DataChannelEntryResponseType<T> => {
  clock += 1;
  const createdAt = new Date(Date.UTC(2026, 9, 21, 12, 0, clock)).toISOString();
  return {
    createdAt,
    updatedAt: createdAt,
    channelName: 'x',
    subChannelName: 'default',
    createdBy,
    entryId,
    payloadJson,
    pluginName: 'BbbPluginCodenames',
    toRoles: [],
  };
};

const publicGame = () => toPublicGame(playingState());

describe('parseGameState', () => {
  it('uses the newest entry whose author is the host it names', () => {
    const older = entry(HOST, { schema: 1, game: publicGame() }, 'old');
    const newer = entry(HOST, { schema: 1, game: { ...publicGame(), version: 11 } }, 'new');
    const forged = entry('w_other', { schema: 1, game: { ...publicGame(), version: 99 } }, 'forged');
    const parsed = parseGameState([older, newer, forged])!;
    expect(parsed.entryId).toBe('new');
    expect(parsed.game.version).toBe(11);
    expect(parsed.staleEntryIds.sort()).toEqual(['forged', 'old']);
  });

  it('ignores other schemas and malformed games', () => {
    expect(parseGameState([entry(HOST, { schema: 2, game: publicGame() })])).toBeNull();
    expect(parseGameState([entry(HOST, { schema: 1, game: { ...publicGame(), words: ['a'] } })]))
      .toBeNull();
    expect(parseGameState([])).toBeNull();
    expect(parseGameState(undefined)).toBeNull();
  });
});

describe('sanitizePublicGame', () => {
  it('keeps a valid game unchanged', () => {
    expect(sanitizePublicGame(publicGame())).toEqual(publicGame());
  });

  it('rejects inconsistent games', () => {
    const game = publicGame();
    expect(sanitizePublicGame({ ...game, revealed: game.revealed.slice(1) })).toBeNull();
    expect(sanitizePublicGame({ ...game, phase: 'playing' })).toBeNull();
    expect(sanitizePublicGame({ ...game, turn: null })).toBeNull();
    expect(sanitizePublicGame({ ...game, key: ['red'] })).toBeNull();
    expect(sanitizePublicGame({ ...game, version: -1 })).toBeNull();
    expect(sanitizePublicGame(null)).toBeNull();
  });

  it('drops invalid seats and history events', () => {
    const game = {
      ...publicGame(),
      roster: { ...publicGame().roster, w_bad: { team: 'green', role: 'agent' } },
      history: [{ type: 'pass', team: 'red', by: 'w_red1' }, { type: 'hack' }],
    };
    const sanitized = sanitizePublicGame(game)!;
    expect(sanitized.roster.w_bad).toBeUndefined();
    expect(sanitized.history).toEqual([{ type: 'pass', team: 'red', by: 'w_red1' }]);
  });

  it('keeps valid votes while guessing, each user once per card', () => {
    const game = { ...publicGame(), phase: 'guess' };
    const votes = [
      { userId: 'w_red1', index: 3 },
      { userId: 'w_red1', index: 3 },
      { userId: 'w_red2', index: 25 },
      { userId: '', index: 1 },
      { userId: 'w_red2', index: 3, extra: true },
    ];
    expect(sanitizePublicGame({ ...game, votes })!.votes).toEqual([
      { userId: 'w_red1', index: 3 }, { userId: 'w_red2', index: 3 },
    ]);
    // Older entries have no votes; outside the guesses there are none.
    expect(sanitizePublicGame({ ...game, votes: undefined })!.votes).toEqual([]);
    expect(sanitizePublicGame({ ...game, phase: 'clue', votes })!.votes).toEqual([]);
  });
});

describe('parseSecretKey', () => {
  it('takes the key of the running match sent by the host', () => {
    const game = publicGame();
    const stale = entry(HOST, { matchId: 'old', key: KEY });
    const fake = entry('w_other', { matchId: game.matchId, key: KEY });
    const good = entry(HOST, { matchId: game.matchId, key: KEY }, 'good');
    expect(parseSecretKey([stale, fake, good], game)).toEqual({ entryId: 'good', key: KEY });
    expect(parseSecretKey([stale, fake], game)).toBeNull();
    expect(parseSecretKey([good], { ...game, matchId: null })).toBeNull();
  });
});

describe('parseIntents', () => {
  it('lists intents to this host oldest first; the actor is the creator', () => {
    const first = entry('w_red1', { hostId: HOST, baseVersion: 3, action: { type: 'guess', index: 4 } }, 'a');
    const second = entry('w_red2', { hostId: HOST, baseVersion: 3, action: { type: 'endTurn' } }, 'b');
    const elsewhere = entry('w_red1', { hostId: 'w_old', baseVersion: 3, action: { type: 'endTurn' } }, 'c');
    const broken = entry('w_red1', { hostId: HOST, baseVersion: 3, action: { type: 'guess', index: -2 } }, 'd');
    expect(parseIntents([broken, elsewhere, second, first], HOST)).toEqual([
      { entryId: 'a', actorId: 'w_red1', intent: { action: { type: 'guess', index: 4 }, baseVersion: 3 } },
      { entryId: 'b', actorId: 'w_red2', intent: { action: { type: 'endTurn' }, baseVersion: 3 } },
      { entryId: 'c', actorId: 'w_red1', intent: null },
      { entryId: 'd', actorId: 'w_red1', intent: null },
    ]);
  });
});

describe('sanitizeAction', () => {
  it('accepts well-formed actions only', () => {
    // Nobody picks a team any more.
    expect(sanitizeAction({ type: 'join', team: 'red', role: 'agent' })).toBeNull();
    expect(sanitizeAction({ type: 'claimSpymaster', userId: 'w_other' })).toEqual({ type: 'claimSpymaster' });
    expect(sanitizeAction({ type: 'giveClue', word: 'mar', count: 'unlimited' }))
      .toEqual({ type: 'giveClue', word: 'mar', count: 'unlimited' });
    expect(sanitizeAction({ type: 'assign', userId: 'w_x', seat: null }))
      .toEqual({ type: 'assign', userId: 'w_x', seat: null });
    expect(sanitizeAction({ type: 'giveClue', word: 'mar', count: 12 })).toBeNull();
    expect(sanitizeAction({
      type: 'vote', index: 3, on: false, by: 'x',
    }))
      .toEqual({ type: 'vote', index: 3, on: false });
    expect(sanitizeAction({ type: 'vote', index: 3, on: 'yes' })).toBeNull();
    expect(sanitizeAction({ type: 'guess', index: 1.5 })).toBeNull();
    expect(sanitizeAction({ type: 'reveal', index: 1 })).toBeNull();
    expect(sanitizeAction({ type: 'deleteEverything' })).toBeNull();
    expect(sanitizeAction('start')).toBeNull();
  });
});

describe('keyReceivers', () => {
  it('is the host and both spymasters, without repeats', () => {
    expect(keyReceivers(playingState()).sort()).toEqual([HOST, 'w_blue0'].sort());
    const roster = { ...playingState().roster, [HOST]: undefined };
    delete roster[HOST];
    const state = playingState({
      roster: { ...roster, w_red1: { team: 'red', role: 'spymaster' } } as never,
    });
    expect(keyReceivers(state).sort()).toEqual([HOST, 'w_blue0', 'w_red1'].sort());
  });
});
