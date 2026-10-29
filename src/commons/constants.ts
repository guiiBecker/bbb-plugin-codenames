export const DATA_CHANNELS = {
  /** Public game state; one entry per opened game, replaced on every change by the host. */
  GAME_STATE: 'gameState',
  /** Key map of the running match, sent privately to the host and the two spymasters. */
  SECRET_KEY: 'secretKey',
  /** Actions of players who are not the host, sent privately to the host. */
  INTENTS: 'intents',
} as const;

export const LOG_CODES = {
  STARTED: 'plg_started',
  STOPPED: 'plg_stopped',
  SETTINGS_ERROR: 'codenames_settings_error',
  CURRENT_USER_ERROR: 'codenames_current_user_error',
  USERS_ERROR: 'codenames_users_error',
  CHANNEL_ERROR: 'codenames_channel_error',
  GAME_OPENED: 'codenames_game_opened',
  GAME_CLOSED: 'codenames_game_closed',
  ACTION_REJECTED: 'codenames_action_rejected',
  ACTION_APPLIED: 'codenames_action_applied',
  HOST_RESTORE_FAILED: 'codenames_host_restore_failed',
} as const;

export const MODERATOR_ROLE = 'MODERATOR';

export const HIDDEN_GAME_STORAGE_KEY_PREFIX = 'bbb-plugin-codenames:hidden:';

export const DATA_TEST = {
  APPS_GALLERY_ENTRY: 'codenamesAppsGalleryEntry',
  MEDIA_AREA_TOGGLE: 'codenamesMediaAreaToggle',
  MAIN_AREA: 'codenamesMainArea',
  ADMIN_MODAL: 'codenamesAdminModal',
  ADMIN_OPEN: 'codenamesAdminOpen',
  ADMIN_SHOW: 'codenamesAdminShow',
  ADMIN_TAKE_OVER: 'codenamesAdminTakeOver',
  ADMIN_CLOSE: 'codenamesAdminClose',
  LOBBY_JOIN: 'codenamesLobbyJoin',
  LOBBY_LEAVE: 'codenamesLobbyLeave',
  LOBBY_CLAIM_SPYMASTER: 'codenamesLobbyClaimSpymaster',
  LOBBY_RELEASE_SPYMASTER: 'codenamesLobbyReleaseSpymaster',
  LOBBY_ASSIGN: 'codenamesLobbyAssign',
  LOBBY_SHUFFLE: 'codenamesLobbyShuffle',
  LOBBY_START: 'codenamesLobbyStart',
  WORD_LIST_OPTION: 'codenamesWordListOption',
  WORD_LIST_CUSTOM: 'codenamesWordListCustom',
  CARD: 'codenamesCard',
  CLUE_WORD: 'codenamesClueWord',
  CLUE_COUNT: 'codenamesClueCount',
  CLUE_SUBMIT: 'codenamesClueSubmit',
  VOTES: 'codenamesVotes',
  VOTE_ITEM: 'codenamesVoteItem',
  GUESS: 'codenamesGuess',
  END_TURN: 'codenamesEndTurn',
  ABORT: 'codenamesAbort',
  NEW_MATCH: 'codenamesNewMatch',
  BACK_TO_LOBBY: 'codenamesBackToLobby',
  HISTORY: 'codenamesHistory',
  HISTORY_ROUND: 'codenamesHistoryRound',
  SIDEBAR: 'codenamesSidebar',
  SIDEBAR_AREA: 'codenamesSidebarArea',
  SIDEBAR_OPEN: 'codenamesSidebarOpen',
  SIDEBAR_CLOSE: 'codenamesSidebarClose',
  SIDEBAR_CLOSE_CONFIRM: 'codenamesSidebarCloseConfirm',
  SIDEBAR_SHOW_BOARD: 'codenamesSidebarShowBoard',
  SIDEBAR_TEAMS: 'codenamesSidebarTeams',
  SCOREBOARD: 'codenamesScoreboard',
} as const;
