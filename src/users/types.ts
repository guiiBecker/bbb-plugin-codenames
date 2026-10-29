export interface MeetingUsers {
  /** Ids of the users in the meeting, or null while unknown. */
  presentUserIds: Set<string> | null;
  /** Ids of the moderators in the meeting, or null while unknown. */
  moderatorIds: Set<string> | null;
  /** Display names by user id (roles are always keyed by id, never by name). */
  names: Record<string, string>;
}
