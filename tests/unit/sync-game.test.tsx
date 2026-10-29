import {
  beforeEach, describe, expect, it,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { GameAction } from '../../src/game/types';
import { useGameSync } from '../../src/sync/hooks';
import { useMeetingUsers } from '../../src/users/hooks';
import { FakeMeeting, createFakeMeeting } from './helpers/fake-meeting';

const USERS = [
  { userId: 'w_mod', name: 'Moderadora', isModerator: true },
  { userId: 'w_mod2', name: 'Outro moderador', isModerator: true },
  { userId: 'w_redSpy', name: 'Rita', isModerator: false },
  { userId: 'w_red1', name: 'Rui', isModerator: false },
  { userId: 'w_blueSpy', name: 'Bia', isModerator: false },
  { userId: 'w_blue1', name: 'Beto', isModerator: false },
  { userId: 'w_viewer', name: 'Vera', isModerator: false },
];

let meeting: FakeMeeting;

const renderUser = (userId: string) => renderHook(() => {
  const pluginApi = meeting.apiFor(userId);
  const users = useMeetingUsers(pluginApi);
  return useGameSync({
    pluginApi,
    currentUserId: userId,
    isModerator: meeting.isModerator(userId),
    users,
    defaultWordList: 'pt-BR',
  });
});

type Client = ReturnType<typeof renderUser>;

const send = (client: Client, action: GameAction) => act(() => {
  client.result.current.dispatch(action);
});

/**
 * The lobby flow with fixed teams: the moderator seats the four players (a draw would be
 * random), and one player per team offers to be the spymaster.
 */
const seatPlayers = (clients: Record<string, Client>) => {
  (['w_redSpy', 'w_red1'] as const).forEach((userId) => send(clients.w_mod, {
    type: 'assign', userId, seat: { team: 'red', role: 'agent' },
  }));
  (['w_blueSpy', 'w_blue1'] as const).forEach((userId) => send(clients.w_mod, {
    type: 'assign', userId, seat: { team: 'blue', role: 'agent' },
  }));
  send(clients.w_redSpy, { type: 'claimSpymaster' });
  send(clients.w_blueSpy, { type: 'claimSpymaster' });
};

/** Opens a game hosted by w_mod, seats everyone and starts a match. */
const startMatch = () => {
  const clients = Object.fromEntries(USERS.map((user) => [user.userId, renderUser(user.userId)]));
  act(() => clients.w_mod.result.current.openGame(false));
  seatPlayers(clients);
  send(clients.w_mod, { type: 'start' });
  return clients;
};

const gameOf = (client: Client) => client.result.current.game!;

/** An agent votes for a card, then presses "Guess" with it on top of the list. */
const guessCard = (client: Client, index: number) => {
  send(client, { type: 'vote', index, on: true });
  send(client, { type: 'guess', index });
};

/** The spymaster and agent of the team in turn. */
const turnPlayers = (clients: Record<string, Client>) => {
  const team = gameOf(clients.w_mod).turn;
  return team === 'red'
    ? { spy: clients.w_redSpy, agent: clients.w_red1, other: clients.w_blue1 }
    : { spy: clients.w_blueSpy, agent: clients.w_blue1, other: clients.w_red1 };
};

beforeEach(() => {
  meeting = createFakeMeeting(USERS);
});

describe('game sync', () => {
  it('opens a lobby that everyone sees, hosted by the moderator who opened it', () => {
    const mod = renderUser('w_mod');
    const viewer = renderUser('w_viewer');
    expect(viewer.result.current.game).toBeNull();
    act(() => mod.result.current.openGame(false));
    expect(gameOf(viewer)).toMatchObject({ phase: 'lobby', hostId: 'w_mod' });
    expect(mod.result.current.isHost).toBe(true);
    expect(viewer.result.current.isHost).toBe(false);
  });

  it('applies intents from other players through the host', () => {
    const clients = startMatch();
    const game = gameOf(clients.w_viewer);
    expect(game.phase).toBe('clue');
    expect(game.roster).toEqual({
      w_redSpy: { team: 'red', role: 'spymaster' },
      w_red1: { team: 'red', role: 'agent' },
      w_blueSpy: { team: 'blue', role: 'spymaster' },
      w_blue1: { team: 'blue', role: 'agent' },
    });
    // Processed intents are deleted.
    expect(meeting.entriesOf('intents')).toHaveLength(0);
    expect(meeting.denied).toEqual([]);
  });

  it('delivers the key map only to the host and the spymasters', () => {
    const clients = startMatch();
    expect(clients.w_redSpy.result.current.secretKey).toHaveLength(25);
    expect(clients.w_blueSpy.result.current.secretKey).toHaveLength(25);
    expect(clients.w_mod.result.current.secretKey).toHaveLength(25);
    ['w_red1', 'w_blue1', 'w_viewer', 'w_mod2'].forEach((userId) => {
      expect(clients[userId].result.current.secretKey).toBeNull();
      // Nothing an agent's browser receives carries the key map, in any channel.
      const seen = JSON.stringify(meeting.everythingVisibleTo(userId));
      expect(seen).not.toContain('assassin');
      expect(seen).not.toContain('neutral');
    });
  });

  it('plays a turn: clue, reveal, and the color reaches everyone', () => {
    const clients = startMatch();
    const { spy, agent } = turnPlayers(clients);
    send(spy, { type: 'giveClue', word: 'xyzzy', count: 2 });
    expect(gameOf(clients.w_viewer)).toMatchObject({
      phase: 'guess', clue: { word: 'xyzzy', count: 2 }, guessesLeft: 3,
    });
    const key = clients.w_mod.result.current.secretKey!;
    const neutral = key.indexOf('neutral');
    send(agent, { type: 'vote', index: neutral, on: true });
    // Everyone sees the vote before the guess.
    const agentId = gameOf(clients.w_mod).turn === 'red' ? 'w_red1' : 'w_blue1';
    expect(gameOf(clients.w_viewer).votes).toEqual([{ userId: agentId, index: neutral }]);
    send(agent, { type: 'guess', index: neutral });
    expect(gameOf(clients.w_viewer).revealed[neutral]).toBe('neutral');
    expect(gameOf(clients.w_viewer).phase).toBe('clue');
    expect(JSON.stringify(meeting.everythingVisibleTo('w_viewer'))).not.toContain('assassin');
  });

  it('ignores actions from players who may not take them', () => {
    const clients = startMatch();
    const { spy, other } = turnPlayers(clients);
    const before = gameOf(clients.w_viewer).version;
    send(other, { type: 'giveClue', word: 'xyzzy', count: 1 });
    send(clients.w_viewer, { type: 'start' });
    expect(gameOf(clients.w_viewer).version).toBe(before);
    send(spy, { type: 'giveClue', word: 'xyzzy', count: 1 });
    expect(gameOf(clients.w_viewer).phase).toBe('guess');
  });

  it('two agents voting at the same time both count; guessing at once reveals one card', () => {
    const clients = startMatch();
    const { spy } = turnPlayers(clients);
    send(spy, { type: 'giveClue', word: 'xyzzy', count: 3 });
    const team = gameOf(clients.w_mod).turn!;
    const secondId = team === 'red' ? 'w_red2' : 'w_blue2';
    const second = renderUser(secondId);
    meeting.addUser({ userId: secondId, name: 'X', isModerator: false });
    act(() => clients.w_mod.result.current.dispatch({
      type: 'assign', userId: secondId, seat: { team, role: 'agent' },
    }));
    const { agent } = turnPlayers(clients);
    const key = clients.w_mod.result.current.secretKey!;
    const own = key.map((c, i) => (c === team ? i : -1)).filter((i) => i >= 0);
    // Both vote based on the same version: votes are not versioned, so neither is lost.
    act(() => {
      agent.result.current.dispatch({ type: 'vote', index: own[0], on: true });
      second.result.current.dispatch({ type: 'vote', index: own[0], on: true });
      second.result.current.dispatch({ type: 'vote', index: own[1], on: true });
    });
    expect(gameOf(clients.w_viewer).votes).toHaveLength(3);
    act(() => {
      agent.result.current.dispatch({ type: 'guess', index: own[0] });
      second.result.current.dispatch({ type: 'guess', index: own[0] });
    });
    const game = gameOf(clients.w_viewer);
    expect(game.revealed[own[0]]).toBe(team);
    expect(game.revealed[own[1]]).toBeNull();
    expect(game.history.filter((event) => event.type === 'reveal')).toHaveLength(1);
    expect(game.votes).toEqual([{ userId: secondId, index: own[1] }]);
  });

  it('a reloaded client recovers the state, and a reloaded host keeps hosting', () => {
    const clients = startMatch();
    const { spy } = turnPlayers(clients);
    send(spy, { type: 'giveClue', word: 'xyzzy', count: 2 });
    clients.w_mod.unmount();
    clients.w_redSpy.unmount();
    const host = renderUser('w_mod');
    const redSpy = renderUser('w_redSpy');
    expect(host.result.current.hostReady).toBe(true);
    expect(redSpy.result.current.secretKey).toHaveLength(25);
    const { agent } = turnPlayers({ ...clients, w_mod: host, w_redSpy: redSpy });
    const key = host.result.current.secretKey!;
    guessCard(agent, key.indexOf('neutral'));
    expect(gameOf(clients.w_viewer).revealed[key.indexOf('neutral')]).toBe('neutral');
  });

  it('a new spymaster gets the key map and the previous one loses it', () => {
    const clients = startMatch();
    act(() => clients.w_mod.result.current.dispatch({
      type: 'assign', userId: 'w_red1', seat: { team: 'red', role: 'spymaster' },
    }));
    expect(gameOf(clients.w_viewer).roster.w_redSpy).toEqual({ team: 'red', role: 'agent' });
    expect(clients.w_red1.result.current.secretKey).toHaveLength(25);
    expect(clients.w_redSpy.result.current.secretKey).toBeNull();
  });

  it('reveals the whole key map to everyone when the match ends', () => {
    const clients = startMatch();
    const { spy, agent } = turnPlayers(clients);
    send(spy, { type: 'giveClue', word: 'xyzzy', count: 1 });
    const key = clients.w_mod.result.current.secretKey!;
    guessCard(agent, key.indexOf('assassin'));
    const game = gameOf(clients.w_viewer);
    expect(game.phase).toBe('ended');
    expect(game.endReason).toBe('assassin');
    expect(clients.w_viewer.result.current.secretKey).toEqual(key);
    expect(meeting.entriesOf('secretKey')).toHaveLength(0);
  });

  it('a new match keeps the teams, swaps the spymasters and the starting team', () => {
    const clients = startMatch();
    const first = gameOf(clients.w_viewer).startingTeam;
    send(clients.w_mod, { type: 'abort' });
    send(clients.w_mod, { type: 'start' });
    const game = gameOf(clients.w_viewer);
    expect(game.phase).toBe('clue');
    expect(game.startingTeam).not.toBe(first);
    expect(game.roster).toEqual({
      w_redSpy: { team: 'red', role: 'agent' },
      w_red1: { team: 'red', role: 'spymaster' },
      w_blueSpy: { team: 'blue', role: 'agent' },
      w_blue1: { team: 'blue', role: 'spymaster' },
    });
    // The key follows the new spymasters.
    expect(clients.w_red1.result.current.secretKey).toHaveLength(25);
    expect(clients.w_redSpy.result.current.secretKey).toBeNull();
  });

  it('the new spymasters get the key even when it arrives before the new game state', () => {
    const clients = startMatch();
    send(clients.w_mod, { type: 'abort' });
    // On BBB the channels refresh independently: here the key entry of the new match reaches
    // clients first, while they still see the ended match.
    act(() => meeting.hold('gameState'));
    send(clients.w_mod, { type: 'start' });
    act(() => meeting.release('gameState'));
    const game = gameOf(clients.w_viewer);
    expect(game.phase).toBe('clue');
    expect(game.roster.w_red1.role).toBe('spymaster');
    expect(clients.w_red1.result.current.secretKey).toHaveLength(25);
    expect(clients.w_blue1.result.current.secretKey).toHaveLength(25);
    expect(clients.w_mod.result.current.secretKey).toHaveLength(25);
    expect(meeting.entriesOf('secretKey')).toHaveLength(1);
  });

  it('a first match also survives the key arriving before the game state', () => {
    const clients = Object.fromEntries(USERS.map((user) => [user.userId, renderUser(user.userId)]));
    act(() => clients.w_mod.result.current.openGame(false));
    seatPlayers(clients);
    act(() => meeting.hold('gameState'));
    send(clients.w_mod, { type: 'start' });
    act(() => meeting.release('gameState'));
    expect(clients.w_redSpy.result.current.secretKey).toHaveLength(25);
    expect(clients.w_blueSpy.result.current.secretKey).toHaveLength(25);
  });

  it('only moderators write the game state; a forged entry is ignored', () => {
    const clients = startMatch();
    const game = gameOf(clients.w_viewer);
    // A viewer cannot push the game state at all (manifest: moderators only).
    const viewerApi = meeting.apiFor('w_red1');
    const { result } = renderHook(() => viewerApi.useDataChannel!('gameState'));
    act(() => result.current.pushEntry({ schema: 1, game: { ...game, winner: 'red' } }));
    expect(meeting.denied).toContain('push gameState by w_red1');
    // Another moderator claiming w_mod is still host is ignored (author ≠ host).
    const modApi = meeting.apiFor('w_mod2');
    const forged = renderHook(() => modApi.useDataChannel!('gameState'));
    act(() => forged.result.current.pushEntry({ schema: 1, game: { ...game, phase: 'ended' } }));
    expect(gameOf(clients.w_viewer).phase).toBe(game.phase);
  });

  it('closing the game clears every channel; another moderator can take over', () => {
    const clients = startMatch();
    act(() => clients.w_mod2.result.current.openGame(true));
    expect(gameOf(clients.w_viewer)).toMatchObject({ hostId: 'w_mod2', phase: 'lobby' });
    expect(Object.keys(gameOf(clients.w_viewer).roster)).toHaveLength(4);
    expect(clients.w_mod.result.current.isHost).toBe(false);
    act(() => clients.w_mod.result.current.closeGame());
    expect(clients.w_viewer.result.current.game).toBeNull();
    ['gameState', 'secretKey', 'intents'].forEach((channel) => {
      expect(meeting.entriesOf(channel)).toHaveLength(0);
    });
  });
});
