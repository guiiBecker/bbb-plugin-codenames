import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  title: { id: 'history.title', description: 'Heading of the history', defaultMessage: 'Rounds' },
  empty: { id: 'history.empty', description: 'History before the first clue', defaultMessage: 'No clue given yet.' },
  round: {
    id: 'history.round',
    description: 'Heading of one round; {0} its number, {1} the team, e.g. "Red team"',
    defaultMessage: 'Round {0} · {1}',
  },
  current: { id: 'history.current', description: 'Marks the round being played', defaultMessage: 'now' },
  roundClue: {
    id: 'history.roundClue',
    description: 'The clue of a round; {0} spymaster, {1} word, {2} number',
    defaultMessage: 'Clue from {0}: {1} · {2}',
  },
  noMoves: { id: 'history.noMoves', description: 'A round with no guess yet', defaultMessage: 'No guess yet.' },
  reveal: {
    id: 'history.reveal',
    description: 'A card was revealed; {0} agent, {1} word, {2} card type',
    defaultMessage: '{0} revealed {1}: {2}',
  },
  pass: { id: 'history.pass', description: 'An agent ended the turn; {0} the agent', defaultMessage: '{0} ended the turn' },
  endAllFound: { id: 'history.endAllFound', description: 'End: all cards found; {0} winner', defaultMessage: '{0} wins: all its cards were found' },
  endAssassin: { id: 'history.endAssassin', description: 'End: assassin revealed; {0} winner', defaultMessage: '{0} wins: the assassin was revealed' },
  endAborted: { id: 'history.endAborted', description: 'End: a moderator ended the match', defaultMessage: 'A moderator ended the match' },
});
