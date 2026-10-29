import { useSyncExternalStore } from 'react';
import { Store } from './types';

export const useStore = <T extends object>(store: Store<T>): T => (
  useSyncExternalStore(store.subscribe, store.getSnapshot)
);
