import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  clueTitle: { id: 'clue.title', description: 'Heading of the clue panel', defaultMessage: 'Clue' },
  yourClue: {
    id: 'clue.yourTurn',
    description: 'Tells the spymaster to give a clue',
    defaultMessage: 'Your turn: give one word and how many cards it relates to.',
  },
  clueWord: { id: 'clue.word', description: 'Label of the clue word field', defaultMessage: 'Clue word' },
  clueWordHelp: {
    id: 'clue.wordHelp',
    description: 'Help under the clue word field',
    defaultMessage: 'One word, not on the board',
  },
  clueCount: { id: 'clue.count', description: 'Label of the number picker', defaultMessage: 'Number of cards' },
  sendClue: { id: 'clue.send', description: 'Sends the clue', defaultMessage: 'Give clue' },
  waitingClue: {
    id: 'clue.waiting',
    description: 'Shown while the spymaster thinks; {0} is the spymaster',
    defaultMessage: 'Waiting for {0} to give a clue.',
  },
  guessesLeft: {
    id: 'clue.guessesLeft',
    description: 'Guesses the team may still make; {0} is the number',
    defaultMessage: '{0, plural, one {# guess left} other {# guesses left}}',
  },
  unlimitedGuesses: { id: 'clue.unlimitedGuesses', description: 'No limit on guesses', defaultMessage: 'Unlimited guesses' },
  pickCard: {
    id: 'clue.pickCard',
    description: 'Tells the agents what to do',
    defaultMessage: 'Vote for cards on the board with your team, then press "Guess" below it.',
  },
  endTurn: { id: 'clue.endTurn', description: 'Ends the turn voluntarily', defaultMessage: 'End turn' },
  endTurnHint: {
    id: 'clue.endTurnHint',
    description: 'Why ending the turn is disabled',
    defaultMessage: 'Make at least one guess first',
  },
});
