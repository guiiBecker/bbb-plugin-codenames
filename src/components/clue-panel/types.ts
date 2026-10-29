import { IntlShape } from 'react-intl';
import { UserLabelContext } from '../../commons/format';
import { ClueCount, GameAction } from '../../game/types';
import { PublicGame } from '../../game/view';

export interface CluePanelProps {
  intl: IntlShape;
  game: PublicGame;
  currentUserId: string | null;
  users: UserLabelContext;
  pending: boolean;
  dispatch: (action: GameAction) => void;
}

export interface ClueFormProps {
  intl: IntlShape;
  game: PublicGame;
  pending: boolean;
  onSubmit: (word: string, count: ClueCount) => void;
}
