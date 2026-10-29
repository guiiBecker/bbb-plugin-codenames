import { IntlShape } from 'react-intl';
import { UserLabelContext } from '../../commons/format';
import { PublicGame } from '../../game/view';
import { VoteTally } from '../../game/votes';

export interface VotePanelProps {
  intl: IntlShape;
  game: PublicGame;
  /** The guessing team's votes, most voted first. */
  tally: VoteTally[];
  users: UserLabelContext;
  /** The viewer is an agent of the team guessing now. */
  canGuess: boolean;
  /** A previous action is still waiting for the host. */
  pending: boolean;
  onGuess: (index: number) => void;
}
