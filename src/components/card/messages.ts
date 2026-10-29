import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  hidden: {
    id: 'card.hiddenLabel',
    description: 'Accessible name of a face-down card; {0} is the word',
    defaultMessage: '{0}, not revealed',
  },
  revealed: {
    id: 'card.revealedLabel',
    description: 'Accessible name of a revealed card; {0} the word, {1} the card type',
    defaultMessage: '{0}, revealed: {1}',
  },
  secret: {
    id: 'card.secretLabel',
    description: 'Accessible name of a face-down card in the key map; {0} the word, {1} the type',
    defaultMessage: '{0}, not revealed, key map: {1}',
  },
  votes: {
    id: 'card.votes',
    description: 'Votes for a card, appended to its accessible name; {0} is the number',
    defaultMessage: '{0, plural, one {# vote} other {# votes}}',
  },
});
