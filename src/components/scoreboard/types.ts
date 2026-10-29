import { IntlShape } from 'react-intl';
import { UserLabelContext } from '../../commons/format';
import { PublicGame } from '../../game/view';

export interface ScoreboardProps {
  intl: IntlShape;
  game: PublicGame;
  users: UserLabelContext;
}
