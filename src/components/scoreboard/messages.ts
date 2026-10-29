import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  remaining: {
    id: 'score.remaining',
    description: 'Cards a team still has to find; {0} is the number',
    defaultMessage: '{0, plural, one {# card left} other {# cards left}}',
  },
  spymaster: { id: 'score.spymaster', description: 'The team spymaster; {0} is the name', defaultMessage: 'Spymaster: {0}' },
  turn: { id: 'score.turn', description: 'Badge on the team whose turn it is', defaultMessage: 'Turn' },
  waitingClue: {
    id: 'score.waitingClue',
    description: 'Phase: waiting for the clue; {0} the team, {1} the spymaster',
    defaultMessage: '{0}: waiting for a clue from {1}',
  },
  guessing: { id: 'score.guessing', description: 'Phase: the agents are guessing; {0} the team', defaultMessage: '{0} is guessing' },
  ended: { id: 'score.ended', description: 'Phase: the match is over', defaultMessage: 'Match over' },
});
