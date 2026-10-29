import styled from 'styled-components';
import {
  colorBackgroundBlue, colorBorderDefault, colorBorderSelected, colorTextDefault, colorTextLight,
} from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team as TeamColor } from '../../game/types';

/** Fills the panel the client gives and scrolls on its own. */
const Panel = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  height: 100%;
  padding: 0.75rem 0.25rem;
  overflow-y: auto;
  color: ${colorTextDefault};
`;

const Moderator = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${colorBorderDefault};
`;

const Confirm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${colorBorderSelected};
  background: ${colorBackgroundBlue};
`;

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const Teams = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

/** One team; the team in turn is highlighted. */
const Team = styled.div<{ $team: TeamColor }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
  border: 1px solid ${colorBorderDefault};
  border-left: 0.3rem solid ${({ $team }) => CARD_THEME[$team].solid};
  font-size: 0.85rem;

  &[aria-current] {
    background: ${({ $team }) => CARD_THEME[$team].soft};
  }
`;

const TeamName = styled.span`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
`;

const Remaining = styled.span`
  margin-left: auto;
  font-weight: 600;
  font-size: 0.75rem;
  color: ${colorTextLight};
`;

const Line = styled.span`
  overflow-wrap: anywhere;
`;

const Role = styled.span`
  margin-right: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${colorTextLight};
`;

export default {
  Panel, Moderator, Confirm, ConfirmActions, Teams, Team, TeamName, Remaining, Line, Role,
};
