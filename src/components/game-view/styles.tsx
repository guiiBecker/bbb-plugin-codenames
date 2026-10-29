import styled from 'styled-components';
import {
  colorBackgroundWhite, colorBorderDefault, colorTextDefault,
} from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team } from '../../game/types';

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  background: ${colorBackgroundWhite};
  color: ${colorTextDefault};

  h1, h2 {
    margin: 0;
  }
`;

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const Role = styled.span<{ $team: Team | null }>`
  padding: 0.2rem 0.75rem;
  border-radius: 1rem;
  border: 1px solid ${({ $team }) => ($team ? CARD_THEME[$team].solid : colorBorderDefault)};
  background: ${({ $team }) => ($team ? CARD_THEME[$team].soft : 'transparent')};
  font-weight: 600;
  font-size: 0.875rem;
`;

/** The match, centered in the main area. */
const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
`;

const HeaderEnd = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

export default {
  Container, Header, HeaderEnd, Role, Column,
};
