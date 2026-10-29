import styled, { css } from 'styled-components';
import { colorBorderDefault, colorTextDefault } from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team } from '../../game/types';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  color: ${colorTextDefault};
`;

const Team = styled.div<{ $team: Team; $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid ${colorBorderDefault};
  border-left: 0.4rem solid ${({ $team }) => CARD_THEME[$team].solid};
  background: ${({ $team }) => CARD_THEME[$team].soft};

  ${({ $active, $team }) => $active && css`
    border-color: ${CARD_THEME[$team].solid};
    box-shadow: 0 0 0 2px ${CARD_THEME[$team].soft};
  `}
`;

const TeamName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
`;

const TurnBadge = styled.span`
  margin-left: auto;
  padding: 0.05rem 0.5rem;
  border-radius: 1rem;
  border: 1px solid currentColor;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const Remaining = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
`;

const Status = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  font-weight: 600;
  text-align: center;
`;

export default {
  Wrapper, Team, TeamName, TurnBadge, Remaining, Status,
};
