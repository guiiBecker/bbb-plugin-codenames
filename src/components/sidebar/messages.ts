import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  title: {
    id: 'sidebar.title',
    description: 'Name of the game entry in the BBB sidebar and apps gallery, once a game is open',
    defaultMessage: 'Codenames',
  },
  open: {
    id: 'sidebar.open',
    description: 'Button above the board that opens the sidebar panel',
    defaultMessage: 'Rounds and controls',
  },
  showBoard: { id: 'sidebar.showBoard', description: 'Shows the hidden board again', defaultMessage: 'Show the board' },
  noGame: { id: 'sidebar.noGame', description: 'Shown when no game is open', defaultMessage: 'No game is open.' },
  notStarted: {
    id: 'sidebar.notStarted',
    description: 'The rounds appear once a match starts',
    defaultMessage: 'The rounds appear here once the match starts.',
  },
  teams: { id: 'sidebar.teams', description: 'Heading of the team list in the panel', defaultMessage: 'Teams' },
  moderatorTools: { id: 'sidebar.moderatorTools', description: 'Heading of the moderator controls', defaultMessage: 'Moderator controls' },
  abort: { id: 'sidebar.abort', description: 'Ends the running match without a winner', defaultMessage: 'End match' },
  abortHint: {
    id: 'sidebar.abortHint',
    description: 'What ending the match does',
    defaultMessage: 'Ends this match without a winner. The game stays open with the same teams.',
  },
  close: { id: 'sidebar.close', description: 'Closes the game for everyone', defaultMessage: 'Close game for everyone' },
  closeQuestion: {
    id: 'sidebar.closeQuestion',
    description: 'Confirmation before closing the game',
    defaultMessage: 'Close the game? The board goes away for everyone and the match is lost.',
  },
  closeConfirm: { id: 'sidebar.closeConfirm', description: 'Confirms closing the game', defaultMessage: 'Close game' },
  cancel: { id: 'sidebar.cancel', description: 'Keeps the game open', defaultMessage: 'Cancel' },
});
