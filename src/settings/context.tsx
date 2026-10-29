import * as React from 'react';
import { createContext, useEffect, useMemo } from 'react';
import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { SettingsContextValue, SettingsProviderProps } from './types';
import { parseSettings } from './service';
import { LOG_CODES } from '../commons/constants';

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ pluginApi, children }: SettingsProviderProps) {
  const { data, loading, error } = pluginApi.usePluginSettings!();

  useEffect(() => {
    if (error) {
      pluginLogger.error(
        { logCode: LOG_CODES.SETTINGS_ERROR, extraInfo: { error: error.message } },
        `Failed to load settings of ${pluginApi.pluginName}, using defaults`,
      );
    }
  }, [error]);

  const settings = useMemo(
    () => parseSettings(data as Record<string, unknown> | undefined),
    [data],
  );

  useEffect(() => {
    if (loading) return;
    if (typeof pluginLogger.level === 'function') {
      pluginLogger.level(settings.debug ? 'debug' : 'info');
    }
  }, [loading, settings.debug]);

  // Settings only tune behaviour, so a failed load degrades to the defaults.
  const value = useMemo(
    () => ({ settings, ready: !loading || !!error }),
    [settings, loading, error],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
