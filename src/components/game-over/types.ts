import { IntlShape } from 'react-intl';
import { GameAction } from '../../game/types';
import { PublicGame } from '../../game/view';

export interface GameOverProps {
  intl: IntlShape;
  game: PublicGame;
  isModerator: boolean;
  dispatch: (action: GameAction) => void;
}
