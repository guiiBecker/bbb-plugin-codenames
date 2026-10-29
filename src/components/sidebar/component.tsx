import * as React from 'react';
import { useMemo, useState } from 'react';
import { BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { teamLabel, userLabel } from '../../commons/format';
import { CardTypeIcon } from '../../commons/icons';
import { TEAMS } from '../../game/constants';
import { membersOf, spymasterOf } from '../../game/roster';
import { remainingCards } from '../../game/view';
import { useStore } from '../../store/hooks';
import History from '../history/component';
import RosterEditor from '../lobby/roster-editor';
import { intlMessages as adminMessages } from '../admin/messages';
import { intlMessages as lobbyMessages } from '../lobby/messages';
import { intlMessages as scoreMessages } from '../scoreboard/messages';
import { intlMessages } from './messages';
import Styled from './styles';
import { SidebarProps } from './types';

/**
 * The game's entry in the BBB sidebar once a game is open: the rounds for everyone, and the
 * moderator controls for moderators. Rendered in a React root owned by the client, like the game
 * view: reads the store.
 */
function Sidebar({ store }: SidebarProps) {
  const {
    intl, currentUserId, isModerator, isHost, hostPresent, game, names, presentUserIds, dispatch,
    closeGame, hidden, showBoard, takeOver,
  } = useStore(store);
  const [confirmClose, setConfirmClose] = useState(false);
  const users = useMemo(
    () => ({ names, currentUserId, presentUserIds }),
    [names, currentUserId, presentUserIds],
  );

  if (!game) {
    return (
      <Styled.Panel>
        <BBBTypography>{intl.formatMessage(intlMessages.noGame)}</BBBTypography>
      </Styled.Panel>
    );
  }

  const inPlay = game.phase === 'clue' || game.phase === 'guess';
  const seated = Object.keys(game.roster).length > 0;
  const remaining = remainingCards(game);

  return (
    <Styled.Panel data-test={DATA_TEST.SIDEBAR}>
      {hidden && (
        <BBButton
          size="sm"
          label={intl.formatMessage(intlMessages.showBoard)}
          dataTest={DATA_TEST.SIDEBAR_SHOW_BOARD}
          onClick={showBoard}
        />
      )}

      {seated && (
        <Styled.Teams aria-labelledby="codenames-sidebar-teams" data-test={DATA_TEST.SIDEBAR_TEAMS}>
          <BBBTypography variant="selected" id="codenames-sidebar-teams">
            {intl.formatMessage(intlMessages.teams)}
          </BBBTypography>
          {TEAMS.map((team) => {
            const spymaster = spymasterOf(game.roster, team);
            const agents = membersOf(game.roster, team, 'agent');
            const active = inPlay && game.turn === team;
            return (
              <Styled.Team key={team} $team={team} aria-current={active ? 'true' : undefined}>
                <Styled.TeamName>
                  <CardTypeIcon color={team} size={14} />
                  {teamLabel(intl, team, true)}
                  {game.phase !== 'lobby' && (
                    <Styled.Remaining>
                      {intl.formatMessage(scoreMessages.remaining, { 0: remaining[team] })}
                    </Styled.Remaining>
                  )}
                </Styled.TeamName>
                <Styled.Line>
                  <Styled.Role>{intl.formatMessage(lobbyMessages.spymaster)}</Styled.Role>
                  {spymaster
                    ? userLabel(intl, spymaster, users)
                    : intl.formatMessage(lobbyMessages.nobody)}
                </Styled.Line>
                <Styled.Line>
                  <Styled.Role>{intl.formatMessage(lobbyMessages.agents)}</Styled.Role>
                  {agents.length
                    ? agents.map((userId) => userLabel(intl, userId, users)).join(', ')
                    : intl.formatMessage(lobbyMessages.nobody)}
                </Styled.Line>
              </Styled.Team>
            );
          })}
        </Styled.Teams>
      )}

      {game.phase === 'lobby' ? (
        <BBBTypography variant="text2">{intl.formatMessage(intlMessages.notStarted)}</BBBTypography>
      ) : (
        // Between a turn's end and the next clue no round is being played.
        <History intl={intl} events={game.history} users={users} running={game.phase === 'guess'} />
      )}

      {isModerator && (
        <Styled.Moderator aria-labelledby="codenames-sidebar-moderator">
          <BBBTypography variant="selected" id="codenames-sidebar-moderator">
            {intl.formatMessage(intlMessages.moderatorTools)}
          </BBBTypography>
          {inPlay && (
            <BBButton
              variant="secondary"
              size="sm"
              label={intl.formatMessage(intlMessages.abort)}
              tooltipLabel={intl.formatMessage(intlMessages.abortHint)}
              dataTest={DATA_TEST.ABORT}
              onClick={() => dispatch({ type: 'abort' })}
            />
          )}
          {confirmClose ? (
            <Styled.Confirm role="group" aria-label={intl.formatMessage(intlMessages.close)}>
              <BBBTypography variant="text2">{intl.formatMessage(intlMessages.closeQuestion)}</BBBTypography>
              <Styled.ConfirmActions>
                <BBButton
                  variant="tertiary"
                  size="sm"
                  label={intl.formatMessage(intlMessages.cancel)}
                  onClick={() => setConfirmClose(false)}
                />
                <BBButton
                  color="danger"
                  size="sm"
                  label={intl.formatMessage(intlMessages.closeConfirm)}
                  dataTest={DATA_TEST.SIDEBAR_CLOSE_CONFIRM}
                  onClick={() => {
                    setConfirmClose(false);
                    closeGame();
                  }}
                />
              </Styled.ConfirmActions>
            </Styled.Confirm>
          ) : (
            <BBButton
              variant="secondary"
              color="danger"
              size="sm"
              label={intl.formatMessage(intlMessages.close)}
              dataTest={DATA_TEST.SIDEBAR_CLOSE}
              onClick={() => setConfirmClose(true)}
            />
          )}
          {inPlay && <RosterEditor intl={intl} game={game} users={users} dispatch={dispatch} />}
          {!isHost && (
            <>
              <BBBTypography variant="text3">
                {intl.formatMessage(
                  hostPresent ? adminMessages.takeOverHint : adminMessages.hostAway,
                )}
              </BBBTypography>
              <BBButton
                variant="tertiary"
                size="sm"
                label={intl.formatMessage(adminMessages.takeOver)}
                dataTest={DATA_TEST.ADMIN_TAKE_OVER}
                onClick={takeOver}
              />
            </>
          )}
        </Styled.Moderator>
      )}
    </Styled.Panel>
  );
}

export default Sidebar;
