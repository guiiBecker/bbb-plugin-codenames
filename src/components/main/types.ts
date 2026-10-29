import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';
import { GameViewState, Store } from '../../store/types';

export interface CodenamesPluginProps {
  pluginUuid: string;
  pluginName: string;
}

export interface MainContentProps {
  pluginApi: PluginApi;
  intl: IntlShape;
}

export interface AppsGalleryEntryOptions {
  pluginApi: PluginApi;
  intl: IntlShape;
  isModerator: boolean;
  gameOpen: boolean;
  onOpenAdmin: () => void;
}

export interface MediaAreaToggleOptions {
  pluginApi: PluginApi;
  intl: IntlShape;
  gameOpen: boolean;
  hidden: boolean;
  onToggle: () => void;
}

export interface GenericContentOptions {
  pluginApi: PluginApi;
  intl: IntlShape;
  /** A game is open: the sidebar panel is registered. */
  gameOpen: boolean;
  /** The board is shown in the main area. */
  showGame: boolean;
  store: Store<GameViewState>;
}
