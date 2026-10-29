import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  description: {
    id: 'admin.description',
    description: 'Explains the game in the moderator modal',
    defaultMessage: 'Two teams, red and blue, race to find their words on a 5×5 board. Each team’s spymaster gives one-word clues; the agents guess. The board replaces the presentation for everyone, and each person can switch back.',
  },
  open: { id: 'admin.open', description: 'Opens a new game', defaultMessage: 'Open game' },
  show: { id: 'admin.show', description: 'Shows the hidden game again', defaultMessage: 'Show the game' },
  statusHost: { id: 'admin.statusHost', description: 'The viewer hosts the game', defaultMessage: 'A game is open and you are its host.' },
  statusOther: { id: 'admin.statusOther', description: 'Someone else hosts; {0} the host', defaultMessage: 'A game is open, hosted by {0}.' },
  hostAway: {
    id: 'admin.hostAway',
    description: 'The host left',
    defaultMessage: 'The host left the meeting, so the game is paused. Taking over ends the current match and keeps the teams.',
  },
  takeOver: { id: 'admin.takeOver', description: 'Becomes the host', defaultMessage: 'Take over as host' },
  takeOverHint: {
    id: 'admin.takeOverHint',
    description: 'What taking over does',
    defaultMessage: 'You become the host: the current match ends (its key map stays with the previous host) and a new lobby opens with the same teams.',
  },
  abort: { id: 'admin.abort', description: 'Ends the running match', defaultMessage: 'End match' },
  close: { id: 'admin.close', description: 'Closes the game for everyone', defaultMessage: 'Close game for everyone' },
});
