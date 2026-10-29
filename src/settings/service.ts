import { CodenamesSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

type RawSettings = Record<string, unknown> | undefined | null;

const readBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const readWordList = (
  value: unknown,
  fallback: CodenamesSettings['defaultWordList'],
): CodenamesSettings['defaultWordList'] => (value === 'pt-BR' || value === 'en' ? value : fallback);

/**
 * Merges the raw plugin settings over the defaults, discarding values of the wrong type.
 * The manifest's `defaultValue`s are not applied by the core for optional settings,
 * so this is where the defaults actually take effect.
 */
export const parseSettings = (raw: RawSettings): CodenamesSettings => ({
  debug: readBoolean(raw?.debug, DEFAULT_SETTINGS.debug),
  defaultWordList: readWordList(raw?.defaultWordList, DEFAULT_SETTINGS.defaultWordList),
});
