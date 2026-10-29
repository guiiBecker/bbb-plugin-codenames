import styled, { css } from 'styled-components';
import {
  colorBorderDefault, colorBrand1, colorTextDefault, colorTextLight, colorWhite,
} from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME } from '../../commons/theme';
import { Team } from '../../game/types';

const Panel = styled.section<{ $team: Team }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid ${colorBorderDefault};
  border-left: 0.4rem solid ${({ $team }) => CARD_THEME[$team].solid};
  color: ${colorTextDefault};
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const Title = styled.h2`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${colorTextLight};
`;

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled.li<{ $leading: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  padding: 0.35rem 0.6rem;
  border-radius: 0.4rem;
  border: 1px solid ${colorBorderDefault};

  ${({ $leading }) => $leading && css`
    border: 2px dashed ${colorBrand1};
  `}
`;

const Word = styled.span`
  font-weight: 800;
  text-transform: uppercase;
  overflow-wrap: anywhere;
`;

const Count = styled.span`
  font-weight: 600;
`;

const Voters = styled.span`
  flex: 1 1 10rem;
  min-width: 0;
  color: ${colorTextLight};
  font-size: 0.875rem;
`;

const Next = styled.span`
  padding: 0.05rem 0.5rem;
  border-radius: 1rem;
  background: ${colorBrand1};
  color: ${colorWhite};
  font-size: 0.75rem;
  font-weight: 700;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export default {
  Panel, Header, Title, List, Item, Word, Count, Voters, Next, Actions,
};
