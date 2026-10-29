import { HIDDEN_GAME_STORAGE_KEY_PREFIX, MODERATOR_ROLE } from '../../commons/constants';

export const isModeratorRole = (role: string | undefined): boolean => role === MODERATOR_ROLE;

export const hiddenGameStorageKey = (gameEntryId: string): string => (
  `${HIDDEN_GAME_STORAGE_KEY_PREFIX}${gameEntryId}`
);

export const readHiddenGame = (gameEntryId: string): boolean => {
  try {
    return window.localStorage.getItem(hiddenGameStorageKey(gameEntryId)) === 'true';
  } catch {
    return false;
  }
};

export const writeHiddenGame = (gameEntryId: string, hidden: boolean): void => {
  try {
    const key = hiddenGameStorageKey(gameEntryId);
    if (hidden) window.localStorage.setItem(key, 'true');
    else window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the choice then
    // lasts only for this page load, which is acceptable for a view preference.
  }
};
