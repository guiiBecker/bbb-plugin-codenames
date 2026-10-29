import { CardColor } from '../game/types';

/**
 * Card colors. Text on solid backgrounds keeps a contrast of at least 4.5:1, and every type
 * also has its own icon and texture, so the board never depends on color alone.
 */
export const CARD_THEME: Record<CardColor, {
  solid: string;
  text: string;
  soft: string;
  texture: string;
}> = {
  red: {
    solid: '#C62828',
    text: '#FFFFFF',
    soft: 'rgba(198, 40, 40, 0.14)',
    texture: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.16) 0 6px, transparent 6px 12px)',
  },
  blue: {
    solid: '#1565C0',
    text: '#FFFFFF',
    soft: 'rgba(21, 101, 192, 0.14)',
    texture: 'radial-gradient(rgba(255, 255, 255, 0.22) 2px, transparent 2.5px) 0 0 / 12px 12px',
  },
  neutral: {
    solid: '#D9CFB8',
    text: '#3A342A',
    soft: 'rgba(160, 145, 110, 0.18)',
    texture: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.07) 0 2px, transparent 2px 9px)',
  },
  assassin: {
    solid: '#202124',
    text: '#FFFFFF',
    soft: 'rgba(32, 33, 36, 0.2)',
    texture: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.12) 0 3px, transparent 3px 9px), '
      + 'repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.12) 0 3px, transparent 3px 9px)',
  },
};

/** A face-down card. */
export const HIDDEN_CARD = {
  background: '#F7F3EA',
  border: '#CFC6B2',
  text: '#2B2925',
};
