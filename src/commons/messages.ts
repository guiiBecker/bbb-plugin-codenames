import { defineMessages } from 'react-intl';

/** Messages shared by several components: teams, roles, card types and action errors. */
export const commonMessages = defineMessages({
  appName: { id: 'app.name', description: 'Name of the plugin', defaultMessage: 'Codenames' },
  teamRed: { id: 'team.red', description: 'Red team name', defaultMessage: 'Red' },
  teamBlue: { id: 'team.blue', description: 'Blue team name', defaultMessage: 'Blue' },
  teamRedLong: { id: 'team.redLong', description: 'Red team, in a sentence', defaultMessage: 'Red team' },
  teamBlueLong: { id: 'team.blueLong', description: 'Blue team, in a sentence', defaultMessage: 'Blue team' },
  roleSpymaster: { id: 'role.spymaster', description: 'Role that gives clues', defaultMessage: 'Spymaster' },
  roleAgent: { id: 'role.agent', description: 'Role that guesses', defaultMessage: 'Agent' },
  roleSpectator: { id: 'role.spectator', description: 'Not playing', defaultMessage: 'Spectator' },
  colorRed: { id: 'card.red', description: 'Card of the red team', defaultMessage: 'red team card' },
  colorBlue: { id: 'card.blue', description: 'Card of the blue team', defaultMessage: 'blue team card' },
  colorNeutral: { id: 'card.neutral', description: 'Neutral card', defaultMessage: 'neutral card' },
  colorAssassin: { id: 'card.assassin', description: 'The assassin card', defaultMessage: 'assassin' },
  unknownUser: { id: 'user.unknown', description: 'A participant who left', defaultMessage: 'Someone who left' },
  absent: { id: 'user.absent', description: 'Marks a player who is not in the meeting', defaultMessage: '(away)' },
  you: { id: 'user.you', description: 'Marks the current user in lists', defaultMessage: '(you)' },
  unlimited: { id: 'clue.unlimited', description: 'Clue number with no limit', defaultMessage: 'unlimited' },
  wordListPtBR: { id: 'wordList.ptBR', description: 'Portuguese word list', defaultMessage: 'Portuguese (Brazil)' },
  wordListEn: { id: 'wordList.en', description: 'English word list', defaultMessage: 'English' },
  wordListCustom: { id: 'wordList.custom', description: 'Pasted word list', defaultMessage: 'Custom list' },
});

/** Why an action was refused; shown to the user who tried it. */
export const errorMessages = defineMessages({
  notModerator: { id: 'error.notModerator', description: 'Action error', defaultMessage: 'Only moderators can do this.' },
  wrongPhase: { id: 'error.wrongPhase', description: 'Action error', defaultMessage: 'That is not possible at this point of the game.' },
  notYourTurn: { id: 'error.notYourTurn', description: 'Action error', defaultMessage: 'It is not your turn.' },
  spymasterTaken: { id: 'error.spymasterTaken', description: 'Action error', defaultMessage: 'This team already has a spymaster.' },
  notInTeam: { id: 'error.notInTeam', description: 'Action error', defaultMessage: 'You need to be in a team first.' },
  teamsNotReady: {
    id: 'error.teamsNotReady',
    description: 'Action error',
    defaultMessage: 'Each team needs exactly one spymaster and at least one agent.',
  },
  notEnoughPlayers: { id: 'error.notEnoughPlayers', description: 'Action error', defaultMessage: 'The draw needs at least four participants in the meeting.' },
  notEnoughWords: { id: 'error.notEnoughWords', description: 'Action error', defaultMessage: 'The word list needs at least 25 different words.' },
  clueEmpty: { id: 'error.clueEmpty', description: 'Clue error', defaultMessage: 'Type a clue.' },
  clueNotOneWord: { id: 'error.clueNotOneWord', description: 'Clue error', defaultMessage: 'The clue must be a single word.' },
  clueTooLong: { id: 'error.clueTooLong', description: 'Clue error', defaultMessage: 'The clue is too long.' },
  clueMatchesBoard: {
    id: 'error.clueMatchesBoard',
    description: 'Clue error; {0} is the board word',
    defaultMessage: 'The clue cannot be, contain or be part of a word on the board ({0}).',
  },
  invalidClueCount: { id: 'error.invalidClueCount', description: 'Clue error', defaultMessage: 'Pick a number from 0 to 9, or unlimited.' },
  invalidCard: { id: 'error.invalidCard', description: 'Action error', defaultMessage: 'That card does not exist.' },
  cardAlreadyRevealed: { id: 'error.cardAlreadyRevealed', description: 'Action error', defaultMessage: 'That card is already revealed.' },
  mustGuessFirst: { id: 'error.mustGuessFirst', description: 'Action error', defaultMessage: 'Make at least one guess before ending the turn.' },
  noVotes: { id: 'error.noVotes', description: 'Action error', defaultMessage: 'Vote for at least one card before guessing.' },
  votesChanged: {
    id: 'error.votesChanged',
    description: 'Action error',
    defaultMessage: 'The votes changed before your guess arrived. Check the list and try again.',
  },
  teamNeedsSpymaster: { id: 'error.teamNeedsSpymaster', description: 'Action error', defaultMessage: 'During a match each team must keep a spymaster.' },
  teamNeedsAgent: { id: 'error.teamNeedsAgent', description: 'Action error', defaultMessage: 'During a match each team must keep at least one agent.' },
  stale: { id: 'error.stale', description: 'Action error', defaultMessage: 'The game changed before your action arrived. Try again.' },
  invalidAction: { id: 'error.invalidAction', description: 'Action error', defaultMessage: 'That action is not valid.' },
});
