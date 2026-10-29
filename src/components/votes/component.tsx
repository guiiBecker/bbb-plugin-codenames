import * as React from 'react';
import { BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { teamLabel, userLabel } from '../../commons/format';
import { intlMessages } from './messages';
import Styled from './styles';
import { VotePanelProps } from './types';

/**
 * The guessing team's votes, under the board, for everyone to follow. Its agents get the "Guess"
 * button, which reveals the card on top of the list.
 */
function VotePanel({
  intl, game, tally, users, canGuess, pending, onGuess,
}: VotePanelProps) {
  if (game.phase !== 'guess' || !game.turn) return null;
  const leader = tally[0] ?? null;
  const titleId = 'codenames-votes-title';

  return (
    <Styled.Panel aria-labelledby={titleId} data-test={DATA_TEST.VOTES} $team={game.turn}>
      <Styled.Header>
        <Styled.Title id={titleId}>
          {intl.formatMessage(intlMessages.title, { 0: teamLabel(intl, game.turn, true) })}
        </Styled.Title>
        <BBBTypography variant="text2">
          {intl.formatMessage(canGuess ? intlMessages.howToVote : intlMessages.rule)}
        </BBBTypography>
      </Styled.Header>

      {tally.length === 0 ? (
        <BBBTypography>{intl.formatMessage(intlMessages.none)}</BBBTypography>
      ) : (
        <Styled.List aria-live="polite">
          {tally.map(({ index, voters }, position) => (
            <Styled.Item key={index} data-test={DATA_TEST.VOTE_ITEM} $leading={position === 0}>
              <Styled.Word>{game.words[index]}</Styled.Word>
              <Styled.Count>
                {intl.formatMessage(intlMessages.count, { 0: voters.length })}
              </Styled.Count>
              <Styled.Voters>
                {voters.map((id) => userLabel(intl, id, users)).join(', ')}
              </Styled.Voters>
              {position === 0 && <Styled.Next>{intl.formatMessage(intlMessages.next)}</Styled.Next>}
            </Styled.Item>
          ))}
        </Styled.List>
      )}

      {canGuess && (
        <Styled.Actions>
          <BBButton
            label={leader
              ? intl.formatMessage(intlMessages.guess, { 0: game.words[leader.index] })
              : intl.formatMessage(intlMessages.guessNoVotes)}
            dataTest={DATA_TEST.GUESS}
            disabled={pending || !leader}
            tooltipLabel={leader ? undefined : intl.formatMessage(intlMessages.guessHint)}
            onClick={() => { if (leader) onGuess(leader.index); }}
          />
        </Styled.Actions>
      )}
    </Styled.Panel>
  );
}

export default VotePanel;
