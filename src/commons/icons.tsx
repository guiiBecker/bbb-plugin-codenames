import * as React from 'react';
import { CardColor } from '../game/types';

/** Apps gallery icon: a 3×3 grid of cards with one revealed. */
export const CODENAMES_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="5" rx="1" />
    <rect x="10" y="3" width="5" height="5" rx="1" fill="currentColor" />
    <rect x="17" y="3" width="4" height="5" rx="1" />
    <rect x="3" y="10" width="5" height="5" rx="1" />
    <rect x="10" y="10" width="5" height="5" rx="1" />
    <rect x="17" y="10" width="4" height="5" rx="1" />
    <rect x="3" y="17" width="5" height="4" rx="1" />
    <rect x="10" y="17" width="5" height="4" rx="1" />
    <rect x="17" y="17" width="4" height="4" rx="1" />
  </svg>
) as React.SVGProps<SVGSVGElement>;

/**
 * One shape per card type, so the board never depends on color alone:
 * red is a diamond, blue a circle, neutral a bar, the assassin a skull.
 */
const SHAPES: Record<CardColor, React.ReactNode> = {
  red: <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />,
  blue: <circle cx="12" cy="12" r="9" />,
  neutral: <rect x="3" y="9.5" width="18" height="5" rx="1.5" />,
  assassin: (
    <path d="M12 2C7 2 3 5.6 3 10.2c0 2.7 1.4 5 3.5 6.4V20a1 1 0 0 0 1 1h2v-2h1.5v2h3v-2H15v2h2a1 1 0 0 0 1-1v-3.4c2.1-1.4 3.5-3.7 3.5-6.4C21 5.6 17 2 12 2Zm-3.5 11.5a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Zm7 0a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Z" />
  ),
};

export function CardTypeIcon({ color, size }: { color: CardColor; size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[color]}
    </svg>
  );
}
