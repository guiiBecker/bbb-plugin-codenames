import { IntlShape } from 'react-intl';
import { GameAction } from '../../game/types';
import { PublicGame } from '../../game/view';

export interface AdminModalProps {
  intl: IntlShape;
  isOpen: boolean;
  onClose: () => void;
  game: PublicGame | null;
  isHost: boolean;
  hostName: string;
  hostPresent: boolean;
  /** This viewer hid the game. */
  hidden: boolean;
  onShow: () => void;
  onOpenGame: (keepTeams: boolean) => void;
  onCloseGame: () => void;
  dispatch: (action: GameAction) => void;
}
