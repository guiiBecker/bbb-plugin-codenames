import { HistoryEvent, Team } from './types';

type ClueEvent = Extract<HistoryEvent, { type: 'clue' }>;
type MoveEvent = Extract<HistoryEvent, { type: 'reveal' | 'pass' }>;
type EndEvent = Extract<HistoryEvent, { type: 'end' }>;

/** One turn: a clue and what the team did with it. */
export interface Round {
  /** 1 for the match's first clue. */
  number: number;
  team: Team;
  clue: ClueEvent;
  moves: MoveEvent[];
}

export interface MatchLog {
  /** In play order. */
  rounds: Round[];
  /** How the match ended, once it has. */
  end: EndEvent | null;
}

/** Splits a match's history into rounds: every clue opens one. */
export const groupRounds = (history: readonly HistoryEvent[]): MatchLog => {
  const rounds: Round[] = [];
  let end: EndEvent | null = null;
  history.forEach((event) => {
    if (event.type === 'clue') {
      rounds.push({
        number: rounds.length + 1, team: event.team, clue: event, moves: [],
      });
    } else if (event.type === 'end') {
      end = event;
    } else {
      // A move before any clue only happens when the history was cut short: it is dropped.
      rounds.at(-1)?.moves.push(event);
    }
  });
  return { rounds, end };
};
