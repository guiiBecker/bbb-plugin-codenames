import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  DataChannelTypes, PluginApi, RESET_DATA_CHANNEL, pluginLogger,
} from 'bigbluebutton-html-plugin-sdk';
import { DATA_CHANNELS, LOG_CODES } from '../commons/constants';
import { AWAITED_ACTIONS } from '../game/constants';
import { cryptoRng } from '../game/random';
import { applyAction, applyIntent, createLobby } from '../game/reducer';
import {
  ActionContext, ActionResult, GameAction, GameState, WordListConfig,
} from '../game/types';
import { restoreGameState, toPublicGame } from '../game/view';
import { resolveWordPool } from '../words/service';
import { PENDING_ACTION_TIMEOUT_MS } from './constants';
import {
  keyReceivers, keySignature, parseGameState, parseIntents, parseSecretKey, toGameStatePayload,
} from './service';
import {
  GameStatePayload, IntentPayload, SecretKeyPayload,
} from './types';
import {
  GameChannels, GameSync, HostAuthority, UseGameSyncOptions, UseHostAuthorityOptions,
} from './hook-types';

const useChannelErrorLog = (pluginApi: PluginApi, channel: string, error?: Error) => {
  useEffect(() => {
    if (!error) return;
    pluginLogger.error(
      { logCode: LOG_CODES.CHANNEL_ERROR, extraInfo: { channel, error: error.message } },
      `Failed to read the ${channel} data channel of ${pluginApi.pluginName}`,
    );
  }, [error]);
};

/** The three channels, read as ALL_ITEMS: the plugin picks the latest entry itself. */
export const useGameChannels = (pluginApi: PluginApi): GameChannels => {
  const gameChannel = pluginApi.useDataChannel!<GameStatePayload>(
    DATA_CHANNELS.GAME_STATE,
    DataChannelTypes.ALL_ITEMS,
  );
  const keyChannel = pluginApi.useDataChannel!<SecretKeyPayload>(
    DATA_CHANNELS.SECRET_KEY,
    DataChannelTypes.ALL_ITEMS,
  );
  const intentChannel = pluginApi.useDataChannel!<IntentPayload>(
    DATA_CHANNELS.INTENTS,
    DataChannelTypes.ALL_ITEMS,
  );
  const { data: gameData, loading: gameLoading, error: gameError } = gameChannel.data;
  const { data: keyData, loading: keyLoading, error: keyError } = keyChannel.data;
  const { data: intentData, error: intentError } = intentChannel.data;
  useChannelErrorLog(pluginApi, DATA_CHANNELS.GAME_STATE, gameError);
  useChannelErrorLog(pluginApi, DATA_CHANNELS.SECRET_KEY, keyError);
  useChannelErrorLog(pluginApi, DATA_CHANNELS.INTENTS, intentError);

  // On error stay quiet (no game) instead of guessing, as the characters plugin does.
  const gameEntry = useMemo(
    () => (gameLoading || gameError ? null : parseGameState(gameData)),
    [gameData, gameLoading, gameError],
  );
  const secret = useMemo(
    () => (keyError ? null : parseSecretKey(keyData, gameEntry?.game ?? null)),
    [keyData, keyError, gameEntry],
  );

  return {
    loading: !!gameLoading,
    keyLoading: !!keyLoading,
    gameEntry,
    secret,
    keyEntries: keyData ?? [],
    intentEntries: intentData ?? [],
    pushGame: gameChannel.pushEntry,
    replaceGame: gameChannel.replaceEntry,
    deleteGame: gameChannel.deleteEntry,
    pushKey: keyChannel.pushEntry,
    deleteKey: keyChannel.deleteEntry,
    pushIntent: intentChannel.pushEntry,
    deleteIntent: intentChannel.deleteEntry,
  };
};

/** Deletes entries once: data-channel deletions take a round trip to show up. */
const useDeleteOnce = () => {
  const requested = useRef(new Set<string>());
  return useCallback((remove: (ids: string[]) => void, ids: string[]) => {
    const fresh = ids.filter((id) => !requested.current.has(id));
    if (!fresh.length) return;
    fresh.forEach((id) => requested.current.add(id));
    remove(fresh);
  }, []);
};

const inPlay = (state: GameState) => state.phase === 'clue' || state.phase === 'guess';

/**
 * Runs on the host's client only (the moderator who opened the game). It holds the full state,
 * key map included, applies its own actions and everyone else's intents, and publishes the
 * public state to all and the key map to the host and the spymasters only.
 */
export const useHostAuthority = ({
  pluginApi, channels, currentUserId, users,
}: UseHostAuthorityOptions): HostAuthority => {
  const { gameEntry, secret } = channels;
  const isHost = !!gameEntry && !!currentUserId && gameEntry.game.hostId === currentUserId;
  const held = useRef<{ entryId: string; state: GameState } | null>(null);
  const publishedKey = useRef<string | null>(null);
  const processed = useRef(new Set<string>());
  const deleteOnce = useDeleteOnce();

  /** The host's state: what it last applied, or the published state restored after a reload. */
  const currentState = useCallback((): GameState | null => {
    if (!isHost || !gameEntry) return null;
    const { current } = held;
    if (current && current.entryId === gameEntry.entryId
      && current.state.version >= gameEntry.game.version) {
      return current.state;
    }
    const restored = restoreGameState(gameEntry.game, secret?.key ?? null);
    if (!restored) return null;
    held.current = { entryId: gameEntry.entryId, state: restored };
    // After a reload the key entry of the running match is already out there.
    publishedKey.current = secret && inPlay(restored) ? keySignature(restored) : null;
    return restored;
  }, [isHost, gameEntry, secret]);

  const publish = useCallback((entryId: string, state: GameState) => {
    channels.replaceGame(entryId, toGameStatePayload(toPublicGame(state)));
    if (!inPlay(state)) {
      publishedKey.current = null;
      return;
    }
    const signature = keySignature(state);
    if (publishedKey.current === signature) return;
    // Private entry: the server delivers it only to these users.
    channels.pushKey(
      { matchId: state.matchId!, key: state.key },
      { receivers: keyReceivers(state).map((userId) => ({ userId })) },
    );
    publishedKey.current = signature;
  }, [channels.replaceGame, channels.pushKey]);

  const apply = useCallback((
    action: GameAction,
    actorId: string,
    actorIsModerator: boolean,
    baseVersion?: number,
  ): ActionResult => {
    const state = currentState();
    if (!state || !held.current) return { ok: false, error: 'invalidAction' };
    const ctx: ActionContext = {
      actorId,
      actorIsModerator,
      rng: cryptoRng,
      resolveWordPool,
      presentUserIds: users.presentUserIds,
    };
    const result = baseVersion === undefined
      ? applyAction(state, action, ctx)
      : applyIntent(state, { action, baseVersion }, ctx);
    if (!result.ok) {
      pluginLogger.debug(
        {
          logCode: LOG_CODES.ACTION_REJECTED,
          extraInfo: { type: action.type, error: result.error },
        },
        `Action rejected in ${pluginApi.pluginName}`,
      );
      return result;
    }
    held.current = { entryId: held.current.entryId, state: result.state };
    publish(held.current.entryId, result.state);
    pluginLogger.debug(
      {
        logCode: LOG_CODES.ACTION_APPLIED,
        extraInfo: { type: action.type, version: result.state.version },
      },
      `Action applied in ${pluginApi.pluginName}`,
    );
    return result;
  }, [currentState, publish, users.presentUserIds]);

  // Apply the intents sent to this host, oldest first. Waits for the user list, which says who
  // is a moderator, and for the restored state (the key map arrives after the public state).
  const intents = useMemo(
    () => (isHost ? parseIntents(channels.intentEntries, currentUserId!) : []),
    [isHost, channels.intentEntries, currentUserId],
  );
  const hostReady = isHost && currentState() !== null;
  useEffect(() => {
    if (!hostReady || !users.moderatorIds) return;
    intents.forEach(({ entryId, actorId, intent }) => {
      if (processed.current.has(entryId)) return;
      processed.current.add(entryId);
      if (!intent) return;
      apply(intent.action, actorId, users.moderatorIds!.has(actorId), intent.baseVersion);
    });
    deleteOnce(channels.deleteIntent, intents.map((intent) => intent.entryId));
  }, [hostReady, intents, users.moderatorIds, apply]);

  // Housekeeping: older game entries, and key entries other than the running match's newest.
  useEffect(() => {
    if (!isHost || !gameEntry) return;
    deleteOnce(channels.deleteGame, gameEntry.staleEntryIds);
  }, [isHost, gameEntry?.staleEntryIds.join(',')]);

  // Which key entry to keep follows the match the host holds, not the game state it has received:
  // channels refresh independently, so a new match's key can arrive before its game state.
  useEffect(() => {
    if (!isHost || channels.keyLoading) return;
    const state = held.current?.state;
    if (!state) return;
    const mine = channels.keyEntries.filter((entry) => entry.createdBy === currentUserId);
    const keep = inPlay(state)
      ? mine
        .filter((entry) => entry.payloadJson?.matchId === state.matchId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]?.entryId
      : undefined;
    deleteOnce(
      channels.deleteKey,
      mine.filter((entry) => entry.entryId !== keep).map((entry) => entry.entryId),
    );
  }, [isHost, channels.keyEntries, channels.keyLoading, gameEntry?.game.version]);

  useEffect(() => {
    if (!isHost || !gameEntry || hostReady || channels.keyLoading) return;
    pluginLogger.warn(
      { logCode: LOG_CODES.HOST_RESTORE_FAILED, extraInfo: { matchId: gameEntry.game.matchId } },
      `The host of ${pluginApi.pluginName} could not restore the match: the key map is missing`,
    );
  }, [isHost, hostReady, channels.keyLoading, gameEntry?.game.matchId]);

  const reset = useCallback(() => {
    held.current = null;
    publishedKey.current = null;
    processed.current.clear();
  }, []);

  return {
    isHost, hostReady, apply, reset,
  };
};

export const useGameSync = ({
  pluginApi, currentUserId, isModerator, users, defaultWordList,
}: UseGameSyncOptions): GameSync => {
  const channels = useGameChannels(pluginApi);
  const host = useHostAuthority({
    pluginApi, channels, currentUserId, users,
  });
  const game = channels.gameEntry?.game ?? null;
  const [pendingVersion, setPendingVersion] = useState<number | null>(null);

  useEffect(() => {
    if (pendingVersion === null) return undefined;
    if (game?.version !== pendingVersion) {
      setPendingVersion(null);
      return undefined;
    }
    const timer = setTimeout(() => setPendingVersion(null), PENDING_ACTION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingVersion, game?.version]);

  const dispatch = useCallback((action: GameAction): ActionResult | null => {
    if (!game || !currentUserId) return null;
    const awaited = AWAITED_ACTIONS.has(action.type);
    if (host.isHost) {
      const result = host.apply(action, currentUserId, isModerator);
      if (result.ok && awaited) setPendingVersion(game.version);
      return result;
    }
    channels.pushIntent(
      { hostId: game.hostId, baseVersion: game.version, action },
      { receivers: [{ userId: game.hostId }] },
    );
    if (awaited) setPendingVersion(game.version);
    return null;
  }, [game, currentUserId, isModerator, host.isHost, host.apply, channels.pushIntent]);

  const openGame = useCallback((keepTeams: boolean) => {
    if (!isModerator || !currentUserId) return;
    const wordList: WordListConfig = game?.wordList ?? { id: defaultWordList, customWords: [] };
    const roster = keepTeams && game ? game.roster : {};
    const lobby = createLobby(currentUserId, wordList, roster);
    host.reset();
    channels.deleteKey([RESET_DATA_CHANNEL]);
    channels.deleteIntent([RESET_DATA_CHANNEL]);
    channels.pushGame(toGameStatePayload(toPublicGame(lobby)));
    pluginLogger.info(
      { logCode: LOG_CODES.GAME_OPENED, extraInfo: { keepTeams } },
      `Game opened in ${pluginApi.pluginName}`,
    );
  }, [isModerator, currentUserId, game, defaultWordList, host.reset, channels]);

  const closeGame = useCallback(() => {
    if (!isModerator) return;
    host.reset();
    channels.deleteGame([RESET_DATA_CHANNEL]);
    channels.deleteKey([RESET_DATA_CHANNEL]);
    channels.deleteIntent([RESET_DATA_CHANNEL]);
    pluginLogger.info({ logCode: LOG_CODES.GAME_CLOSED }, `Game closed in ${pluginApi.pluginName}`);
  }, [isModerator, host.reset, channels]);

  return {
    loading: channels.loading,
    gameEntryId: channels.gameEntry?.entryId ?? null,
    game,
    secretKey: game?.key ?? channels.secret?.key ?? null,
    isHost: host.isHost,
    hostReady: host.hostReady,
    pending: pendingVersion !== null && game?.version === pendingVersion,
    dispatch,
    openGame,
    closeGame,
  };
};
