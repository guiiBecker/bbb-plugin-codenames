import * as React from 'react';
import { memo } from 'react';
import { DATA_TEST } from '../../commons/constants';
import { colorLabel } from '../../commons/format';
import { CardTypeIcon } from '../../commons/icons';
import { intlMessages } from './messages';
import Styled from './styles';
import { CardProps } from './types';

const ICON_SIZES = { small: 12, medium: 16, large: 20 };

function Card({
  intl, index, word, revealed, secret, votable, myVote, voteCount, leading, size, onVote,
}: CardProps) {
  const shown = revealed ?? secret;
  let label = intl.formatMessage(intlMessages.hidden, { 0: word });
  if (revealed) {
    label = intl.formatMessage(intlMessages.revealed, { 0: word, 1: colorLabel(intl, revealed) });
  } else if (secret) {
    label = intl.formatMessage(intlMessages.secret, { 0: word, 1: colorLabel(intl, secret) });
  }
  if (voteCount > 0) label = `${label}, ${intl.formatMessage(intlMessages.votes, { 0: voteCount })}`;

  return (
    <Styled.Card
      type="button"
      data-test={DATA_TEST.CARD}
      data-revealed={revealed ?? undefined}
      aria-label={label}
      data-votes={voteCount || undefined}
      // Pressed means "I voted for it": clicking again takes the vote back.
      aria-pressed={votable ? myVote : undefined}
      // aria-disabled keeps the card readable by screen readers, unlike `disabled`.
      aria-disabled={!votable}
      onClick={() => { if (votable) onVote(index, !myVote); }}
      $revealed={revealed}
      $secret={secret}
      $selectable={votable}
      $selected={myVote}
      $leading={leading}
      $size={size}
    >
      {voteCount > 0 && (
        <Styled.Votes aria-hidden $leading={leading}>{voteCount}</Styled.Votes>
      )}
      {revealed && (
        <Styled.Icon><CardTypeIcon color={revealed} size={ICON_SIZES[size]} /></Styled.Icon>
      )}
      {!revealed && shown && (
        <Styled.Corner><CardTypeIcon color={shown} size={ICON_SIZES[size] - 2} /></Styled.Corner>
      )}
      <Styled.Word>{word}</Styled.Word>
    </Styled.Card>
  );
}

export default memo(Card);
