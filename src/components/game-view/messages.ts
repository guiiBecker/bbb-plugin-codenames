import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  noGame: { id: 'game.noGame', description: 'Shown when no game is open', defaultMessage: 'No game is open.' },
  you: { id: 'game.you', description: 'The viewer’s role; {0} the role', defaultMessage: 'You: {0}' },
  roleInTeam: { id: 'game.roleInTeam', description: '{0} role, {1} team', defaultMessage: '{0}, {1}' },
  hostAwayTitle: { id: 'game.hostAwayTitle', description: 'Heading when the host left', defaultMessage: 'Game paused' },
  hostAway: {
    id: 'game.hostAway',
    description: 'The host left; {0} the host',
    defaultMessage: '{0}, who hosts the game, left the meeting. The game continues when they come back.',
  },
  hostAwayModerator: {
    id: 'game.hostAwayModerator',
    description: 'The host left, shown to moderators; {0} the host',
    defaultMessage: '{0}, who hosts the game, left the meeting. The game continues when they come back, or you can take over from the apps gallery (the current match ends, the teams stay).',
  },
  restoring: { id: 'game.restoring', description: 'Host restoring after a reload', defaultMessage: 'Restoring the match…' },
  hostSeesKey: {
    id: 'game.hostSeesKey',
    description: 'Explains why the host sees the key map',
    defaultMessage: 'You host this game and are not playing, so the board shows you the key map. Do not share it.',
  },
});
