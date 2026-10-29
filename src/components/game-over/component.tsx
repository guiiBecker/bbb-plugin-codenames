import * as React from 'react';
import { BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { teamLabel } from '../../commons/format';
import { otherTeam } from '../../game/board';
import { CardTypeIcon } from '../../commons/icons';
import { intlMessages } from './messages';
import Styled from './styles';
import { GameOverProps } from './types';

const REASONS = {
  allFound: intlMessages.reasonAllFound,
  assassin: intlMessages.reasonAssassin,
  aborted: intlMessages.reasonAborted,
};

function GameOver({
  intl, game, isModerator, dispatch,
}: GameOverProps) {
  const { winner, endReason } = game;
  const title = winner
    ? intl.formatMessage(intlMessages.winner, { 0: teamLabel(intl, winner, true) })
    : intl.formatMessage(intlMessages.noWinner);

  return (
    <Styled.Banner role="status" $team={winner}>
      <Styled.Title>
        {winner && <CardTypeIcon color={winner} size={22} />}
        {title}
      </Styled.Title>
      {endReason && <BBBTypography>{intl.formatMessage(REASONS[endReason])}</BBBTypography>}
      <BBBTypography variant="text2">{intl.formatMessage(intlMessages.keyShown)}</BBBTypography>
      {game.startingTeam && (
        <BBBTypography variant="text2">
          {intl.formatMessage(intlMessages.nextMatch, {
            0: teamLabel(intl, otherTeam(game.startingTeam), true),
          })}
        </BBBTypography>
      )}
      {isModerator && (
        <Styled.Actions>
          <BBButton
            variant="tertiary"
            label={intl.formatMessage(intlMessages.backToLobby)}
            dataTest={DATA_TEST.BACK_TO_LOBBY}
            onClick={() => dispatch({ type: 'backToLobby' })}
          />
          <BBButton
            label={intl.formatMessage(intlMessages.newMatch)}
            dataTest={DATA_TEST.NEW_MATCH}
            onClick={() => dispatch({ type: 'start' })}
          />
        </Styled.Actions>
      )}
    </Styled.Banner>
  );
}

export default GameOver;
