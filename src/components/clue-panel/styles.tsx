import styled from 'styled-components';
import {
  colorBorderDefault, colorBorderSelected, colorError, colorTextDefault, colorTextLight,
} from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team } from '../../game/types';

/** One horizontal bar above the board; it wraps on narrow screens. */
const Bar = styled.section<{ $team: Team | null }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.6rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid ${colorBorderDefault};
  border-left: 0.4rem solid ${({ $team }) => ($team ? CARD_THEME[$team].solid : colorBorderDefault)};
  background: ${({ $team }) => ($team ? CARD_THEME[$team].soft : 'transparent')};
  color: ${colorTextDefault};
`;

const Title = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${colorTextLight};
`;

const Grow = styled.div`
  display: flex;
  flex: 1 1 20rem;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

const Form = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.5rem 0.75rem;
`;

const WordField = styled.div`
  flex: 1 1 12rem;
  min-width: 0;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Select = styled.select`
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${colorBorderDefault};
  background: transparent;
  color: ${colorTextDefault};
  font: inherit;
  font-weight: 400;

  &:focus-visible {
    outline: 2px solid ${colorBorderSelected};
    outline-offset: 1px;
  }
`;

const Error = styled.p`
  flex-basis: 100%;
  margin: 0;
  color: ${colorError};
  font-size: 0.875rem;
`;

const Clue = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
`;

const ClueWord = styled.span`
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  overflow-wrap: anywhere;
`;

const ClueCount = styled.span`
  font-size: 1.4rem;
  font-weight: 800;
`;

const Guesses = styled.span`
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  flex: 1 1 16rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem 0.75rem;
`;

export default {
  Bar,
  Title,
  Grow,
  Form,
  WordField,
  Field,
  Select,
  Error,
  Clue,
  ClueWord,
  ClueCount,
  Guesses,
  Actions,
};
