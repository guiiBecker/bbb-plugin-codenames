import { Roster, Team, Vote } from './types';

/** A card the team voted for, with who voted, in the order the votes were cast. */
export interface VoteTally {
  index: number;
  voters: string[];
}

/**
 * The team's votes on face-down cards, most voted first. A tie goes to the card voted first, so
 * the first entry is always the card that "Guess" reveals. Votes of users who are no longer
 * agents of the team (a moderator moved them) do not count.
 */
export const tallyVotes = (
  votes: readonly Vote[],
  roster: Roster,
  team: Team | null,
  isRevealed: (index: number) => boolean,
): VoteTally[] => {
  if (!team) return [];
  const byCard = new Map<number, string[]>();
  votes.forEach(({ userId, index }) => {
    const seat = roster[userId];
    if (seat?.role !== 'agent' || seat.team !== team || isRevealed(index)) return;
    const voters = byCard.get(index) ?? [];
    if (!voters.includes(userId)) voters.push(userId);
    byCard.set(index, voters);
  });
  // Map keeps insertion order, i.e. the order of each card's first vote; sort is stable.
  return [...byCard.entries()]
    .map(([index, voters]) => ({ index, voters }))
    .sort((a, b) => b.voters.length - a.voters.length);
};

/** The card "Guess" reveals now, or null when nobody voted. */
export const leadingCard = (tally: readonly VoteTally[]): number | null => tally[0]?.index ?? null;

export const hasVoted = (votes: readonly Vote[], userId: string | null, index: number): boolean => (
  !!userId && votes.some((vote) => vote.userId === userId && vote.index === index)
);

/** Sets one user's vote on a card; voting again for the same card changes nothing. */
export const setVote = (
  votes: readonly Vote[],
  userId: string,
  index: number,
  on: boolean,
): Vote[] => {
  const others = votes.filter((vote) => !(vote.userId === userId && vote.index === index));
  if (!on) return others;
  return hasVoted(votes, userId, index) ? [...votes] : [...votes, { userId, index }];
};
