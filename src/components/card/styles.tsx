import styled, { css } from 'styled-components';
import {
  colorBorderSelected, colorBrand1, colorTextLight, colorWhite,
} from '@bigbluebutton/bbb-ui-components-react';
import { CARD_THEME, HIDDEN_CARD } from '../../commons/theme';
import { StyledCardProps } from './types';

const FONT_SIZES = { small: '0.68rem', medium: '0.85rem', large: '1.05rem' };

const revealedStyle = ({ $revealed }: StyledCardProps) => $revealed && css`
  background: ${CARD_THEME[$revealed].texture}, ${CARD_THEME[$revealed].solid};
  border-color: ${CARD_THEME[$revealed].solid};
  color: ${CARD_THEME[$revealed].text};
`;

/** A face-down card as a spymaster sees it: a subtle tint, a colored edge and the icon. */
const secretStyle = ({ $revealed, $secret }: StyledCardProps) => !$revealed && $secret && css`
  background: linear-gradient(${CARD_THEME[$secret].soft}, ${CARD_THEME[$secret].soft}),
    ${HIDDEN_CARD.background};
  box-shadow: inset 0 -0.35rem 0 ${CARD_THEME[$secret].solid};
  ${$secret === 'assassin' && css`
    border: 3px solid ${CARD_THEME.assassin.solid};
  `}
`;

const Card = styled.button<StyledCardProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 0;
  min-height: ${({ $size }) => ($size === 'small' ? '3rem' : '4rem')};
  padding: 0.4rem 0.25rem;
  border-radius: 0.5rem;
  border: 2px solid ${HIDDEN_CARD.border};
  background: ${HIDDEN_CARD.background};
  color: ${HIDDEN_CARD.text};
  font: inherit;
  font-size: ${({ $size }) => FONT_SIZES[$size]};
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-align: center;
  overflow-wrap: anywhere;
  hyphens: auto;
  cursor: ${({ $selectable }) => ($selectable ? 'pointer' : 'default')};
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  ${secretStyle}
  ${revealedStyle}

  ${({ $selectable }) => $selectable && css`
    &:hover { transform: translateY(-2px); }
  `}

  /* The card "Guess" would reveal: a dashed ring, so it stays apart from the viewer's own vote. */
  ${({ $leading }) => $leading && css`
    outline: 2px dashed ${colorBrand1};
    outline-offset: 2px;
  `}

  ${({ $selected }) => $selected && css`
    outline: 3px solid ${colorBorderSelected};
    outline-offset: 2px;
    transform: translateY(-2px);
  `}

  &:focus-visible {
    outline: 3px solid ${colorBorderSelected};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover { transform: none; }
  }
`;

const Icon = styled.span`
  display: inline-flex;
  line-height: 0;
`;

const Corner = styled.span`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  display: inline-flex;
  line-height: 0;
  opacity: 0.85;
`;

const Word = styled.span`
  max-width: 100%;
`;

/** How many agents voted for the card, in the top-left corner. */
const Votes = styled.span<{ $leading: boolean }>`
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.25rem;
  box-sizing: border-box;
  border-radius: 0.6rem;
  background: ${({ $leading }) => ($leading ? colorBrand1 : colorTextLight)};
  color: ${colorWhite};
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.15rem;
  letter-spacing: 0;
`;

export default {
  Card, Icon, Corner, Word, Votes,
};
