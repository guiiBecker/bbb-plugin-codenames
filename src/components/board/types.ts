import { IntlShape } from 'react-intl';
import { CardColor } from '../../game/types';
import { PublicGame } from '../../game/view';
import { VoteTally } from '../../game/votes';
import { CardSize } from '../card/types';

export interface BoardProps {
  intl: IntlShape;
  game: PublicGame;
  /** The key map, when this viewer may see it. */
  secretKey: CardColor[] | null;
  currentUserId: string | null;
  /** The guessing team's votes, most voted first. */
  tally: VoteTally[];
  /** The viewer is an agent of the team guessing now. */
  canVote: boolean;
  /** A previous action is still waiting for the host. */
  pending: boolean;
  size: CardSize;
  onVote: (index: number, on: boolean) => void;
}
