import { TEAMS } from './constants';
import { randomInt, shuffle } from './random';
import {
  Roster, RosterProblem, Rng, Seat, Team,
} from './types';

export const spymasterOf = (roster: Roster, team: Team): string | null => (
  Object.keys(roster).find((userId) => (
    roster[userId].team === team && roster[userId].role === 'spymaster'
  )) ?? null
);

export const membersOf = (roster: Roster, team: Team, role?: Seat['role']): string[] => (
  Object.keys(roster).filter((userId) => (
    roster[userId].team === team && (!role || roster[userId].role === role)
  ))
);

/** What keeps the teams from playing: each needs exactly one spymaster and an agent. */
export const rosterProblems = (roster: Roster): RosterProblem[] => {
  const problems: RosterProblem[] = [];
  TEAMS.forEach((team) => {
    const spymasters = membersOf(roster, team, 'spymaster').length;
    if (spymasters === 0) problems.push({ type: 'noSpymaster', team });
    if (spymasters > 1) problems.push({ type: 'tooManySpymasters', team });
    if (membersOf(roster, team, 'agent').length === 0) problems.push({ type: 'noAgent', team });
  });
  return problems;
};

/** Seats a user. Taking a team's spymaster seat moves the previous spymaster to agent. */
export const seatUser = (roster: Roster, userId: string, seat: Seat | null): Roster => {
  const next: Roster = { ...roster };
  delete next[userId];
  if (!seat) return next;
  if (seat.role === 'spymaster') {
    const previous = spymasterOf(next, seat.team);
    if (previous) next[previous] = { team: seat.team, role: 'agent' };
  }
  next[userId] = { team: seat.team, role: seat.role };
  return next;
};

/**
 * Who a draw puts in the teams: everyone in the meeting, moderators and the host included, so
 * nobody has to pick a team. When the user list is unknown, the seated players.
 */
export const drawCandidates = (
  roster: Roster,
  presentUserIds?: ReadonlySet<string> | null,
): string[] => (presentUserIds ? [...presentUserIds] : Object.keys(roster));

/**
 * Draws two balanced random teams, everyone as an agent: each team then picks its spymaster.
 * Returns null with fewer than four players.
 */
export const shuffleRoster = (
  candidates: readonly string[],
  rng: Rng,
  presentUserIds?: ReadonlySet<string> | null,
): Roster | null => {
  const players = [...new Set(candidates)]
    .filter((userId) => !presentUserIds || presentUserIds.has(userId));
  if (players.length < 4) return null;

  const teams: Record<Team, string[]> = { red: [], blue: [] };
  shuffle(players, rng).forEach((userId) => {
    const team: Team = teams.red.length <= teams.blue.length ? 'red' : 'blue';
    teams[team].push(userId);
  });

  const result: Roster = {};
  TEAMS.forEach((team) => {
    teams[team].forEach((userId) => { result[userId] = { team, role: 'agent' }; });
  });
  return result;
};

/**
 * For a new match with the same teams: each team gets a new spymaster drawn at random from its
 * agents (present ones first), and the previous spymaster becomes an agent.
 */
export const rotateSpymasters = (
  roster: Roster,
  rng: Rng,
  presentUserIds?: ReadonlySet<string> | null,
): Roster => TEAMS.reduce((current, team) => {
  const agents = membersOf(current, team, 'agent');
  const present = agents.filter((userId) => !presentUserIds || presentUserIds.has(userId));
  const candidates = present.length ? present : agents;
  if (!candidates.length) return current;
  const next = candidates[randomInt(candidates.length, rng)];
  return seatUser(current, next, { team, role: 'spymaster' });
}, roster);
