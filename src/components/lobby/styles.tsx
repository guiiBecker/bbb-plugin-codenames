import styled from 'styled-components';
import {
  colorBorderDefault, colorBorderSelected, colorTextDefault, colorTextLight, colorWarning,
} from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team } from '../../game/types';

const Lobby = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: ${colorTextDefault};
`;

const Teams = styled.div<{ $compact: boolean }>`
  display: grid;
  grid-template-columns: ${({ $compact }) => ($compact ? '1fr' : '1fr 1fr')};
  gap: 0.75rem;
`;

const TeamColumn = styled.section<{ $team: Team }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid ${({ $team }) => CARD_THEME[$team].solid};
  background: ${({ $team }) => CARD_THEME[$team].soft};
`;

const TeamTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 1.1rem;
`;

const Label = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${colorTextLight};
`;

const Names = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
`;

const Empty = styled.p`
  margin: 0;
  font-style: italic;
  color: ${colorTextLight};
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${colorBorderDefault};
`;

const Details = styled.details`
  summary {
    cursor: pointer;
    font-weight: 600;
  }
`;

const RosterList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
`;

const RosterRow = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const Select = styled.select`
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${colorBorderDefault};
  background: transparent;
  color: ${colorTextDefault};
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${colorBorderSelected};
    outline-offset: 1px;
  }
`;

const Radios = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 7rem;
  box-sizing: border-box;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${colorBorderDefault};
  background: transparent;
  color: ${colorTextDefault};
  font: inherit;
  resize: vertical;

  &:focus-visible {
    outline: 2px solid ${colorBorderSelected};
    outline-offset: 1px;
  }
`;

const Problems = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  color: ${colorWarning};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export default {
  Lobby,
  Teams,
  TeamColumn,
  TeamTitle,
  Label,
  Names,
  Empty,
  Buttons,
  Section,
  Details,
  RosterList,
  RosterRow,
  Select,
  Radios,
  TextArea,
  Problems,
  Actions,
};
