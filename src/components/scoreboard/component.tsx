import * as React from 'react';
import { BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { teamLabel, userLabel } from '../../commons/format';
import { CardTypeIcon } from '../../commons/icons';
import { TEAMS } from '../../game/constants';
import { spymasterOf } from '../../game/roster';
import { remainingCards } from '../../game/view';
import { intlMessages } from './messages';
import Styled from './styles';
import { ScoreboardProps } from './types';

function Scoreboard({ intl, game, users }: ScoreboardProps) {
  const remaining = remainingCards(game);
  const turnTeam = game.turn ? teamLabel(intl, game.turn, true) : '';
  const spymaster = game.turn ? spymasterOf(game.roster, game.turn) : null;
  const spymasterName = spymaster ? userLabel(intl, spymaster, users) : '';

  let status = '';
  if (game.phase === 'clue') status = intl.formatMessage(intlMessages.waitingClue, { 0: turnTeam, 1: spymasterName });
  if (game.phase === 'guess') status = intl.formatMessage(intlMessages.guessing, { 0: turnTeam });
  if (game.phase === 'ended') status = intl.formatMessage(intlMessages.ended);

  return (
    <Styled.Wrapper data-test={DATA_TEST.SCOREBOARD}>
      {TEAMS.map((team) => {
        const active = game.phase !== 'ended' && game.turn === team;
        const teamSpymaster = spymasterOf(game.roster, team);
        return (
          <Styled.Team key={team} $team={team} $active={active} aria-current={active ? 'true' : undefined}>
            <Styled.TeamName>
              <CardTypeIcon color={team} size={18} />
              {teamLabel(intl, team)}
              {active && (
                <Styled.TurnBadge>{intl.formatMessage(intlMessages.turn)}</Styled.TurnBadge>
              )}
            </Styled.TeamName>
            <Styled.Remaining>
              {intl.formatMessage(intlMessages.remaining, { 0: remaining[team] })}
            </Styled.Remaining>
            {teamSpymaster && (
              <BBBTypography variant="text3">
                {intl.formatMessage(intlMessages.spymaster, {
                  0: userLabel(intl, teamSpymaster, users),
                })}
              </BBBTypography>
            )}
          </Styled.Team>
        );
      })}
      <Styled.Status role="status" aria-live="polite">{status}</Styled.Status>
    </Styled.Wrapper>
  );
}

export default Scoreboard;
