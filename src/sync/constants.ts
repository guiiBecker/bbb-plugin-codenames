/** Version of the payload format, so a newer plugin can recognise older entries. */
export const PAYLOAD_SCHEMA = 1;

/**
 * After sending an action, the board waits for the host's answer before accepting another one.
 * A rejected action produces no answer, so the wait ends after this delay.
 */
export const PENDING_ACTION_TIMEOUT_MS = 4000;

export const MAX_CLUE_PAYLOAD_LENGTH = 60;

export const MAX_HISTORY_EVENTS = 200;

/** Every agent voting for every card of a full board stays well under this. */
export const MAX_VOTES = 500;

/** Board words are at most 24 characters; anything far longer is not one. */
export const MAX_WORD_PAYLOAD_LENGTH = 60;
