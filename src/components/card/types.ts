import { IntlShape } from 'react-intl';
import { CardColor } from '../../game/types';

export type CardSize = 'small' | 'medium' | 'large';

export interface CardProps {
  intl: IntlShape;
  index: number;
  word: string;
  /** Color of a revealed card; null while face down. */
  revealed: CardColor | null;
  /** The key-map color this viewer may see for a face-down card (spymasters, or after the end). */
  secret: CardColor | null;
  /** The viewer may vote for this card now. */
  votable: boolean;
  /** The viewer voted for this card. */
  myVote: boolean;
  /** Votes of the guessing team for this card. */
  voteCount: number;
  /** The card "Guess" would reveal now. */
  leading: boolean;
  size: CardSize;
  onVote: (index: number, on: boolean) => void;
}

export interface StyledCardProps {
  $revealed: CardColor | null;
  $secret: CardColor | null;
  $selectable: boolean;
  $selected: boolean;
  $leading: boolean;
  $size: CardSize;
}
