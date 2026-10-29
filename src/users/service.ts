import { MeetingUsers } from './types';

interface BasicUser {
  userId: string;
  name: string;
  isModerator: boolean;
}

export const toMeetingUsers = (users: BasicUser[]): MeetingUsers => ({
  presentUserIds: new Set(users.map((user) => user.userId)),
  moderatorIds: new Set(users.filter((user) => user.isModerator).map((user) => user.userId)),
  names: Object.fromEntries(users.map((user) => [user.userId, user.name])),
});

/** A user's name, or a placeholder for someone who left (data outlives them). */
export const displayName = (
  names: Record<string, string>,
  userId: string,
  fallback: string,
): string => names[userId] || fallback;
