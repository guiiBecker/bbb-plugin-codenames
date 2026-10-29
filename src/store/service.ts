import { Store } from './types';

/**
 * Minimal external store. The world is rendered in a React root owned by the client
 * (GenericContentMainArea), so state crosses roots through this store instead of props:
 * re-registering the main-area item would remount the 3D canvas.
 */
export const createStore = <T extends object>(initialState: T): Store<T> => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => state,
    setState: (partial) => {
      const changed = (Object.keys(partial) as (keyof T)[])
        .some((key) => !Object.is(partial[key], state[key]));
      if (!changed) return;
      state = { ...state, ...partial };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
};
