import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  showPresentation: {
    id: 'mediaArea.showPresentation',
    description: 'Media area option that hides the game for the current user',
    defaultMessage: 'Show presentation',
  },
  showGame: {
    id: 'mediaArea.showGame',
    description: 'Media area option that shows the game again',
    defaultMessage: 'Show Codenames',
  },
  matchStarted: {
    id: 'notification.matchStarted',
    description: 'Toast: a match started; {0} the starting team',
    defaultMessage: 'A Codenames match started. {0} goes first.',
  },
  yourClue: {
    id: 'notification.yourClue',
    description: 'Toast to the spymaster in turn',
    defaultMessage: 'Your turn to give a clue.',
  },
  yourGuess: {
    id: 'notification.yourGuess',
    description: 'Toast to the agents in turn; {0} the clue, {1} the number',
    defaultMessage: 'Clue: {0} · {1}. Your team is guessing.',
  },
  winner: { id: 'notification.winner', description: 'Toast: the match ended; {0} the winner', defaultMessage: '{0} wins!' },
  aborted: { id: 'notification.aborted', description: 'Toast: a moderator ended the match', defaultMessage: 'A moderator ended the match.' },
});
