import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  title: {
    id: 'votes.title',
    description: 'Heading of the vote list; {0} is the team, e.g. "Red team"',
    defaultMessage: 'Votes of the {0}',
  },
  howToVote: {
    id: 'votes.howTo',
    description: 'Tells the agents how voting works',
    defaultMessage: 'Click the cards you think match the clue; click again to take the vote back. "Guess" reveals the card on top: the most voted, or on a tie the one voted first.',
  },
  rule: {
    id: 'votes.rule',
    description: 'Explains the vote list to spectators, spymasters and the other team',
    defaultMessage: 'The agents vote for cards. When one of them presses "Guess", the card on top is revealed.',
  },
  none: { id: 'votes.none', description: 'No card has a vote yet', defaultMessage: 'No votes yet.' },
  count: {
    id: 'votes.count',
    description: 'Votes for a card in the list; {0} is the number',
    defaultMessage: '{0, plural, one {# vote} other {# votes}}',
  },
  next: {
    id: 'votes.next',
    description: 'Marks the card that "Guess" reveals now',
    defaultMessage: 'Revealed on "Guess"',
  },
  guess: {
    id: 'votes.guess',
    description: 'Reveals the most voted card; {0} is its word',
    defaultMessage: 'Guess: {0}',
  },
  guessNoVotes: { id: 'votes.guessNoVotes', description: 'The guess button before any vote', defaultMessage: 'Guess' },
  guessHint: {
    id: 'votes.guessHint',
    description: 'Why the guess button is disabled',
    defaultMessage: 'Vote for at least one card first',
  },
});
