import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import * as React from 'react';
import { WordListId } from '../game/types';

export interface CodenamesSettings {
  debug: boolean;
  /** List selected in a new game; moderators can change it in the lobby. */
  defaultWordList: Exclude<WordListId, 'custom'>;
}

export interface SettingsContextValue {
  settings: CodenamesSettings;
  /** False until the settings subscription resolved (or failed). */
  ready: boolean;
}

export interface SettingsProviderProps {
  pluginApi: PluginApi;
  children: React.ReactNode;
}
