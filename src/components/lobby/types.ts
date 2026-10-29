import { IntlShape } from 'react-intl';
import { UserLabelContext } from '../../commons/format';
import { GameAction, Team, WordListConfig } from '../../game/types';
import { PublicGame } from '../../game/view';

export interface LobbyProps {
  intl: IntlShape;
  game: PublicGame;
  users: UserLabelContext;
  isModerator: boolean;
  compact: boolean;
  dispatch: (action: GameAction) => void;
}

export interface TeamColumnProps {
  intl: IntlShape;
  game: PublicGame;
  team: Team;
  users: UserLabelContext;
  dispatch: (action: GameAction) => void;
}

export interface RosterEditorProps {
  intl: IntlShape;
  game: PublicGame;
  users: UserLabelContext;
  dispatch: (action: GameAction) => void;
}

export interface WordListPickerProps {
  intl: IntlShape;
  wordList: WordListConfig;
  dispatch: (action: GameAction) => void;
}
