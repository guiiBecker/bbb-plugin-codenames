import styled from 'styled-components';
import {
  colorBorderDefault, colorTextDefault, colorTextLight, colorWhite,
} from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team } from '../../game/types';

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
`;

const End = styled.p<{ $team: Team | null }>`
  margin: 0;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
  border: 1px solid ${({ $team }) => ($team ? CARD_THEME[$team].solid : colorBorderDefault)};
  background: ${({ $team }) => ($team ? CARD_THEME[$team].soft : 'transparent')};
  color: ${colorTextDefault};
  font-weight: 700;
  font-size: 0.875rem;
`;

const Rounds = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Round = styled.li<{ $team: Team }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.45rem 0.6rem;
  border-radius: 0.4rem;
  border: 1px solid ${colorBorderDefault};
  border-left: 0.3rem solid ${({ $team }) => CARD_THEME[$team].solid};
  color: ${colorTextDefault};

  &[aria-current] {
    background: ${({ $team }) => CARD_THEME[$team].soft};
  }
`;

const RoundHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${colorTextLight};
`;

const Current = styled.span`
  padding: 0 0.45rem;
  border-radius: 1rem;
  background: ${colorTextLight};
  color: ${colorWhite};
  text-transform: none;
`;

const Clue = styled.span`
  font-weight: 700;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
`;

const Moves = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Move = styled.li`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
`;

export default {
  Section, End, Rounds, Round, RoundHeader, Current, Clue, Moves, Move,
};
