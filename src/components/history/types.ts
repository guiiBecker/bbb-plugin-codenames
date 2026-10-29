import { IntlShape } from 'react-intl';
import { UserLabelContext } from '../../commons/format';
import { HistoryEvent } from '../../game/types';

export interface HistoryProps {
  intl: IntlShape;
  events: HistoryEvent[];
  users: UserLabelContext;
  /** The agents are guessing: the newest round is still being played. */
  running: boolean;
}
