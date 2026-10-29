import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  winner: { id: 'gameOver.winner', description: 'Winner banner; {0} the team', defaultMessage: '{0} wins!' },
  noWinner: { id: 'gameOver.noWinner', description: 'Match ended by a moderator', defaultMessage: 'Match ended' },
  reasonAllFound: { id: 'gameOver.reasonAllFound', description: 'How the match ended', defaultMessage: 'All of the team’s cards were found.' },
  reasonAssassin: { id: 'gameOver.reasonAssassin', description: 'How the match ended', defaultMessage: 'The other team revealed the assassin.' },
  reasonAborted: { id: 'gameOver.reasonAborted', description: 'How the match ended', defaultMessage: 'A moderator ended the match.' },
  keyShown: {
    id: 'gameOver.keyShown',
    description: 'Explains the board after the end',
    defaultMessage: 'The whole key map is now shown on the board: cards nobody revealed have a colored edge.',
  },
  nextMatch: {
    id: 'gameOver.nextMatch',
    description: 'What a new match with the same teams does; {0} the team that will start',
    defaultMessage: 'In a new match with the same teams, {0} starts and each team gets a new spymaster drawn from its agents.',
  },
  newMatch: { id: 'gameOver.newMatch', description: 'Starts a new match with the same teams', defaultMessage: 'New match, same teams' },
  backToLobby: { id: 'gameOver.backToLobby', description: 'Goes back to choosing teams', defaultMessage: 'Change teams' },
});
