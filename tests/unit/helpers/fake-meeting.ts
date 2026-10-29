import { useSyncExternalStore } from 'react';
import {
  DataChannelEntryResponseType, PluginApi, RESET_DATA_CHANNEL,
} from 'bigbluebutton-html-plugin-sdk';
import manifest from '../../../manifest.json';

export interface FakeUser {
  userId: string;
  name: string;
  isModerator: boolean;
}

type StoredEntry = DataChannelEntryResponseType<unknown> & { toUserIds: string[] };

interface PushOptions {
  receivers?: ({ userId: string } | { role: string })[];
}

const INT_MAX = 2 ** 31 - 1;

/** The client never sees who an entry was sent to. */
const withoutReceivers = (entry: StoredEntry) => {
  const copy: Partial<StoredEntry> = { ...entry };
  delete copy.toUserIds;
  return copy as DataChannelEntryResponseType<unknown>;
};

/** akka-apps rejects numbers that do not fit in an Int (they become java.lang.Long). */
const assertNoLongs = (value: unknown): void => {
  if (typeof value === 'number' && Number.isInteger(value) && Math.abs(value) > INT_MAX) {
    throw new Error(`payload number ${value} would be rejected by akka-apps (Long)`);
  }
  if (Array.isArray(value)) value.forEach(assertNoLongs);
  else if (value && typeof value === 'object') Object.values(value).forEach(assertNoLongs);
};

/**
 * An in-memory meeting that behaves like BBB for data channels: it enforces the manifest's
 * permissions (as akka-apps does) and delivers a private entry only to its receivers (as the
 * Hasura view `v_pluginDataChannelEntry_private` does).
 */
export const createFakeMeeting = (initialUsers: FakeUser[]) => {
  let users = [...initialUsers];
  let entries: StoredEntry[] = [];
  let version = 0;
  let clock = Date.parse('2026-10-21T12:00:00.000Z');
  let sequence = 0;
  const denied: string[] = [];
  const listeners = new Set<() => void>();
  const snapshots = new Map<string, { version: number; value: unknown }>();
  /** Channels whose delivery is held back: clients keep seeing the copy taken when held. */
  const held = new Map<string, StoredEntry[]>();

  const notify = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  };
  const tick = () => {
    clock += 10;
    return new Date(clock).toISOString();
  };
  const userById = (userId: string) => users.find((user) => user.userId === userId);
  const channelDef = (name: string) => {
    const definition = manifest.dataChannels.find((channel) => channel.name === name);
    if (!definition) throw new Error(`channel ${name} is not in the manifest`);
    return definition;
  };
  const allowed = (permissions: string[], user: FakeUser | undefined, isCreator = false) => (
    !!user && permissions.some((permission) => (
      permission === 'all'
      || (permission === 'moderator' && user.isModerator)
      || (permission === 'viewer' && !user.isModerator)
      || (permission === 'creator' && isCreator)
    ))
  );
  const isVisible = (entry: StoredEntry, userId: string) => (
    entry.toUserIds.length === 0 || entry.toUserIds.includes(userId)
  );

  /** What a user's client receives for a channel (cached so React sees a stable snapshot). */
  const visibleEntries = (userId: string, channel: string) => {
    const cacheKey = `${userId}|${channel}`;
    const cached = snapshots.get(cacheKey);
    if (cached?.version === version) return cached.value as StoredEntry[];
    const source = held.get(channel) ?? entries;
    const value = source
      .filter((entry) => entry.channelName === channel && isVisible(entry, userId))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(withoutReceivers);
    snapshots.set(cacheKey, { version, value });
    return value as StoredEntry[];
  };

  const usersSnapshot = () => {
    const cached = snapshots.get('users');
    if (cached?.version === version) return cached.value as FakeUser[];
    const value = users.map((user) => ({ ...user }));
    snapshots.set('users', { version, value });
    return value;
  };

  const channelFunctions = new Map<string, unknown>();
  const functionsFor = (userId: string, channel: string) => {
    const cacheKey = `${userId}|${channel}`;
    if (!channelFunctions.has(cacheKey)) {
      const definition = channelDef(channel);
      channelFunctions.set(cacheKey, {
        pushEntry: (payload: unknown, options?: PushOptions) => {
          if (!allowed(definition.pushPermission, userById(userId))) {
            denied.push(`push ${channel} by ${userId}`);
            return;
          }
          assertNoLongs(payload);
          const createdAt = tick();
          sequence += 1;
          entries.push({
            entryId: `e${sequence}`,
            channelName: channel,
            subChannelName: 'default',
            pluginName: manifest.name,
            createdBy: userId,
            createdAt,
            updatedAt: createdAt,
            payloadJson: JSON.parse(JSON.stringify(payload)),
            toRoles: [],
            toUserIds: (options?.receivers ?? [])
              .filter((receiver): receiver is { userId: string } => 'userId' in receiver)
              .map((receiver) => receiver.userId),
          });
          notify();
        },
        replaceEntry: (entryId: string, payload: unknown) => {
          const entry = entries.find((e) => e.entryId === entryId && e.channelName === channel);
          const user = userById(userId);
          const isCreator = entry?.createdBy === userId;
          if (!entry || !allowed(definition.replaceOrDeletePermission, user, isCreator)) {
            denied.push(`replace ${channel} by ${userId}`);
            return;
          }
          assertNoLongs(payload);
          entry.payloadJson = JSON.parse(JSON.stringify(payload));
          entry.updatedAt = tick();
          notify();
        },
        deleteEntry: (ids: string[]) => {
          const user = userById(userId);
          if (ids.includes(RESET_DATA_CHANNEL)) {
            if (!allowed(definition.replaceOrDeletePermission, user)) {
              denied.push(`reset ${channel} by ${userId}`);
              return;
            }
            entries = entries.filter((entry) => entry.channelName !== channel);
          } else {
            entries = entries.filter((entry) => {
              if (entry.channelName !== channel || !ids.includes(entry.entryId)) return true;
              if (allowed(definition.replaceOrDeletePermission, user, entry.createdBy === userId)) {
                return false;
              }
              denied.push(`delete ${channel} by ${userId}`);
              return true;
            });
          }
          notify();
        },
      });
    }
    return channelFunctions.get(cacheKey) as Record<string, unknown>;
  };

  const apis = new Map<string, PluginApi>();
  const apiFor = (userId: string): PluginApi => {
    if (!apis.has(userId)) {
      apis.set(userId, {
        pluginName: manifest.name,
        useDataChannel: (channel: string) => {
          const data = useSyncExternalStore(subscribe, () => visibleEntries(userId, channel));
          return { data: { data, loading: false }, ...functionsFor(userId, channel) };
        },
        useUsersBasicInfo: () => {
          const list = useSyncExternalStore(subscribe, usersSnapshot);
          return { data: { user: list }, loading: false };
        },
      } as unknown as PluginApi);
    }
    return apis.get(userId)!;
  };

  return {
    apiFor,
    denied,
    isModerator: (userId: string) => !!userById(userId)?.isModerator,
    /** Everything a user's browser could ever see, across all channels. */
    everythingVisibleTo: (userId: string) => entries
      .filter((entry) => isVisible(entry, userId))
      .map(withoutReceivers),
    entriesOf: (channel: string) => entries.filter((entry) => entry.channelName === channel),
    /**
     * Holds back a channel's updates, like a live query that has not refetched yet: the server
     * applies writes, but clients keep receiving the old entries until `release`.
     */
    hold: (channel: string) => {
      held.set(channel, entries.filter((e) => e.channelName === channel).map((e) => ({ ...e })));
      notify();
    },
    release: (channel: string) => {
      held.delete(channel);
      notify();
    },
    removeUser: (userId: string) => {
      users = users.filter((user) => user.userId !== userId);
      notify();
    },
    addUser: (user: FakeUser) => {
      users = [...users, user];
      notify();
    },
  };
};

export type FakeMeeting = ReturnType<typeof createFakeMeeting>;
