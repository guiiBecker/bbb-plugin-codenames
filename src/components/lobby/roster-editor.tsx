import * as React from 'react';
import { DATA_TEST } from '../../commons/constants';
import { teamLabel, userLabel } from '../../commons/format';
import { commonMessages } from '../../commons/messages';
import { TEAMS } from '../../game/constants';
import { Role, Seat } from '../../game/types';
import { intlMessages } from './messages';
import Styled from './styles';
import { RosterEditorProps } from './types';

const ROLES: Role[] = ['spymaster', 'agent'];
const SPECTATOR = 'spectator';

const seatValue = (seat: Seat | undefined) => (seat ? `${seat.team}:${seat.role}` : SPECTATOR);

const parseSeat = (value: string): Seat | null => {
  if (value === SPECTATOR) return null;
  const [team, role] = value.split(':') as [Seat['team'], Role];
  return { team, role };
};

/** Lets a moderator seat anyone, in the lobby or during a match (late joiners included). */
function RosterEditor({
  intl, game, users, dispatch,
}: RosterEditorProps) {
  const userIds = [...new Set([...(users.presentUserIds ?? []), ...Object.keys(game.roster)])]
    .sort((a, b) => (users.names[a] ?? '').localeCompare(users.names[b] ?? ''));
  const roleLabel = (role: Role) => intl.formatMessage(
    role === 'spymaster' ? commonMessages.roleSpymaster : commonMessages.roleAgent,
  );

  return (
    <Styled.Details>
      <summary>{intl.formatMessage(intlMessages.organize)}</summary>
      <Styled.RosterList>
        {userIds.map((userId) => {
          const name = userLabel(intl, userId, users);
          return (
            <Styled.RosterRow key={userId}>
              <span>{name}</span>
              <Styled.Select
                aria-label={intl.formatMessage(intlMessages.seatOf, { 0: name })}
                data-test={DATA_TEST.LOBBY_ASSIGN}
                value={seatValue(game.roster[userId])}
                onChange={(event) => dispatch({
                  type: 'assign', userId, seat: parseSeat(event.target.value),
                })}
              >
                <option value={SPECTATOR}>{intl.formatMessage(intlMessages.seatSpectator)}</option>
                {TEAMS.flatMap((team) => ROLES.map((role) => (
                  <option key={`${team}:${role}`} value={`${team}:${role}`}>
                    {intl.formatMessage(intlMessages.seatOption, {
                      0: teamLabel(intl, team), 1: roleLabel(role),
                    })}
                  </option>
                )))}
              </Styled.Select>
            </Styled.RosterRow>
          );
        })}
      </Styled.RosterList>
    </Styled.Details>
  );
}

export default RosterEditor;
