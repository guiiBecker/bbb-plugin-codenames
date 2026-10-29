import styled from 'styled-components';
import { colorBackgroundLight, colorBorderDefault, colorTextDefault } from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team } from '../../game/types';

const Banner = styled.div<{ $team: Team | null }>`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 2px solid ${({ $team }) => ($team ? CARD_THEME[$team].solid : colorBorderDefault)};
  background: ${({ $team }) => ($team ? CARD_THEME[$team].soft : colorBackgroundLight)};
  color: ${colorTextDefault};
`;

const Title = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export default { Banner, Title, Actions };
