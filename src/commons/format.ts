import { IntlShape } from 'react-intl';
import {
  CardColor, ClueCount, Team, WordListId,
} from '../game/types';
import { commonMessages } from './messages';

export const teamLabel = (intl: IntlShape, team: Team, long = false): string => {
  if (team === 'red') return intl.formatMessage(long ? commonMessages.teamRedLong : commonMessages.teamRed);
  return intl.formatMessage(long ? commonMessages.teamBlueLong : commonMessages.teamBlue);
};

const COLOR_MESSAGES = {
  red: commonMessages.colorRed,
  blue: commonMessages.colorBlue,
  neutral: commonMessages.colorNeutral,
  assassin: commonMessages.colorAssassin,
};

export const colorLabel = (intl: IntlShape, color: CardColor): string => (
  intl.formatMessage(COLOR_MESSAGES[color])
);

export const countLabel = (intl: IntlShape, count: ClueCount): string => (
  count === 'unlimited' ? intl.formatMessage(commonMessages.unlimited) : String(count)
);

const WORD_LIST_MESSAGES = {
  'pt-BR': commonMessages.wordListPtBR,
  en: commonMessages.wordListEn,
  custom: commonMessages.wordListCustom,
};

export const wordListLabel = (intl: IntlShape, id: WordListId): string => (
  intl.formatMessage(WORD_LIST_MESSAGES[id])
);

export interface UserLabelContext {
  names: Record<string, string>;
  currentUserId: string | null;
  presentUserIds: Set<string> | null;
}

/** A participant's name, marked when it is the current user or someone who left. */
export const userLabel = (intl: IntlShape, userId: string, context: UserLabelContext): string => {
  const name = context.names[userId] || intl.formatMessage(commonMessages.unknownUser);
  if (userId === context.currentUserId) return `${name} ${intl.formatMessage(commonMessages.you)}`;
  if (context.presentUserIds && !context.presentUserIds.has(userId)) {
    return `${name} ${intl.formatMessage(commonMessages.absent)}`;
  }
  return name;
};
