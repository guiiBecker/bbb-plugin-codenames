# Architecture

## Overview

```
┌──────────────────────────── BBB HTML5 client ─────────────────────────────┐
│                                                                           │
│  Plugin root (always mounted)            Roots created by the client      │
│  ┌──────────────────────────────┐        ┌────────────────────────────┐   │
│  │ main/component.tsx           │ store  │ GenericContentMainArea     │   │
│  │  • SDK init, i18n, settings  │───────▶│  └─ game-view/ (lobby,     │   │
│  │  • sync/ (channels + host)   │        │     board, clue, score,    │   │
│  │  • apps gallery, media area, │        │     votes, game over)      │   │
│  │    admin modal, toasts       │        ├────────────────────────────┤   │
│  └──────────────┬───────────────┘        │ GenericContentSidekickArea │   │
│                 │                        │  └─ sidebar/ (rounds,      │   │
│                 │                        │     moderator controls)    │   │
│                 │                        └────────────────────────────┘   │
│                 │ pluginApi.useDataChannel (GraphQL)                       │
└─────────────────┼──────────────────────────────────────────────────────────┘
                  ▼
   graphql-actions → Redis → akka-apps → Postgres → Hasura live query
```

As in bbb-plugin-characters:

- **The main component** is the only always-mounted part. It owns every SDK hook and every data
  channel.
- **The game view** runs in a React root the client creates and destroys (the main area), and
  reads everything through a small external store (`src/store/`). The sidebar panel works the
  same way, in its own root.
- `setGenericContentItems` replaces all of a plugin's items, so the main area and the sidebar
  are registered in one call (`useGenericContent`). Their ids are passed back on every
  re-registration, so showing or hiding the board does not close an open panel, and each root
  is reused while the client's container is the same node.

## Source layout

| Path | What lives there |
|---|---|
| `src/game/` | **Pure game logic, no BBB import:** board generation, clue validation, roster rules, the reducer, the public projection |
| `src/words/` | Word lists (pt-BR, en) and the custom-list parser |
| `src/sync/` | Data channels, payload sanitizers, the host authority, `useGameSync` |
| `src/components/main/` | SDK wiring: apps gallery entry (only to open a game), sidebar panel and main-area content, opening the panel when a match starts, media-area toggle, toasts, usage logs |
| `src/components/admin/` | Moderator modal: open, take over, end match, close |
| `src/components/game-view/` | The main-area shell; picks lobby or match |
| `src/components/lobby/` | Teams, the participant organizer, the word-list picker |
| `src/components/board/`, `card/` | The 5×5 grid and the cards; a click votes |
| `src/components/votes/` | The team's votes under the board, and the Guess button |
| `src/components/clue-panel/` | Clue form, current clue, guesses left, end turn |
| `src/components/sidebar/` | The game's sidebar panel, its single entry once open: teams and rounds for everyone; end, close, organizer and take over for moderators |
| `src/components/scoreboard/`, `history/`, `game-over/` | Turn and phase, the rounds (`src/game/rounds.ts` groups the history by clue), the end banner |
| `src/users/` | Present users, moderators and names, by user id |
| `src/settings/`, `src/store/`, `src/commons/` | Same roles as in bbb-plugin-characters |

## The game module

The game module (`src/game/`) imports nothing from the SDK or React, so the rules are tested on
their own.

- `applyAction(state, action, ctx)` returns `{ ok, state }` or `{ ok: false, error }`, and
  increments `version` on success.
- `applyIntent` also rejects a `giveClue` whose `baseVersion` is not the current version.
- `src/game/votes.ts` counts the votes: `tallyVotes` lists the cards most voted first, a tie
  going to the card voted first. `guess` reveals the first card of that list.
- `ctx` carries the actor, whether they moderate, the rng (`cryptoRng` in production, seeded in
  tests) and the word pool.
- `toPublicGame(state)` is the only way state leaves the host. It replaces the key map with the
  colors of revealed cards, and adds the full key once the match has ended.
- `restoreGameState(public, key)` rebuilds the host's state after a reload. It refuses a key that
  contradicts a revealed card.

## Data channels

All three are declared in `manifest.json` and read as `ALL_ITEMS`.

| Channel | Push | Replace / delete | Receivers | Payload |
|---|---|---|---|---|
| `gameState` | moderator | moderator | everyone | `{ schema, game: PublicGame }` |
| `secretKey` | moderator | moderator | **host + both spymasters, by user id** | `{ matchId, key }` |
| `intents` | all | creator, moderator | **host only** | `{ hostId, baseVersion, action }` |

- **Why ALL_ITEMS and not LATEST_ITEM** (which bbb-plugin-characters uses for `worldState`):
  - In the client, `LATEST_ITEM` delivers the entries that changed since the last update, not
    "the newest entry".
  - All public entries of the meeting already arrive through one shared subscription, so reading
    a channel as ALL_ITEMS costs nothing more.
  - ALL_ITEMS lets the plugin pick the newest valid entry itself, and lets the host see and delete
    leftovers.
- **One entry per game:** the host pushes a `gameState` entry when it opens the game and replaces
  it on every change. Every client's live query re-sends all public entries on each change, so
  the host deletes older and invalid entries.
- **Private entries are filtered by the server.** `pushEntry(payload, { receivers: [{ userId }] })`
  stores `toUserIds`. Postgres then exposes the entry only through
  `v_pluginDataChannelEntry_private`, which joins on those ids, and Hasura filters that view by
  `X-Hasura-UserId`.
  - A user who is not a receiver never gets the row on their websocket.
  - `replaceEntry` keeps the receivers.
- **Trust rules:**
  - The game is the newest `gameState` entry whose `createdBy` equals the `hostId` it contains. A
    moderator who forges an entry naming someone else as host is ignored.
  - The key map is accepted only from the host, for the running `matchId`.
  - An intent is accepted only when addressed to the current host. Its actor is `createdBy`;
    whether the actor moderates comes from the user list, never from the payload.
  - Every payload is sanitized field by field, and anything inconsistent is dropped.
- **No manual timestamps or large numbers** in payloads: akka-apps rejects numbers that do not fit
  in an `Int`. The fake meeting used in the tests enforces this.

## The host

`useHostAuthority` runs only in the browser of the user named `hostId`. It:

1. **restores** the full state from the public state and the `secretKey` entry it received;
2. **applies** its own actions directly, and each intent from the `intents` channel in creation
   order, then deletes the intents;
3. **publishes:** it replaces the `gameState` entry and, when a match starts or a spymaster
   changes, pushes a new `secretKey` entry to the current receivers;
4. **cleans up** older `gameState` entries, and key entries other than the running match's
   newest. A replaced spymaster therefore loses access to the key.

Other details:

- **The host may play in any seat.** Its browser holds the key map to run the game; when it is an
  agent, the board does not show the key (it is still in the browser's memory: the host is
  trusted not to look). A host who is not playing sees the key on the board, with a warning.
- **The host leaving:** everyone sees "game paused". When the host comes back, the restore picks
  up where the match was. A moderator can take over instead: a new lobby with the same teams.
- **Opening a game** resets `secretKey` and `intents`, and pushes a new `gameState` entry with
  this moderator as host.
- **Closing a game** resets all three channels.

## Concurrency

- Every applied action increments `version`, and the host applies intents oldest first.
- **Votes are not versioned:** they move the version all the time, and two agents voting at once
  must both count. A vote sets a state ("my vote on card 5: on"), so replaying it changes
  nothing.
- **`guess` names the card the sender saw on top.** The host reveals it only if it is still on
  top, and refuses with `votesChanged` otherwise. When two agents press Guess at once, the first
  reveals the card; the second names a card that is no longer face down and is dropped.
- `endTurn` is not versioned either: it applies only to the team in turn, and only after a guess.
- `giveClue` is versioned. Lobby and moderator actions are idempotent: `claimSpymaster` (first
  come, first served: refused once the seat is taken), `releaseSpymaster`, `leave`, `assign`,
  `shuffleTeams` (draws among the users in the meeting, see `drawCandidates`).
- After `giveClue`, `guess` or `endTurn`, the sender's UI waits for the version to move, up to
  4 s, before accepting another one.

## Tests

| File | What it covers |
|---|---|
| `game-board.test.ts` | 9/8/7/1 distribution, random starting team, distinct words, recent words avoided (fallback to the oldest) |
| `game-clue.test.ts` | One word, not a visible word nor part of one (accents, case), counts 0–9 and unlimited |
| `game-reducer.test.ts` | Turns alternate, number + 1 guesses, neutral and opponent cards, assassin, winning, permissions, votes (tally, ties, clearing), the draw and offering to be spymaster, stale actions |
| `game-view.test.ts` | The public projection never carries a hidden color; restore after reload |
| `sync-service.test.ts` | Payload sanitizers and trust rules |
| `sync-game.test.tsx` | Several clients on a **fake meeting** that enforces the manifest permissions and private receivers like akka and Hasura: the key reaches only the host and spymasters, concurrent votes and guesses, host reload, spymaster change, forged entries, closing |
| `ui.test.tsx` | What each role sees, the clue form, voting and the Guess button, lobby (the draw, offering to be spymaster), end screen |
| `sidebar.test.tsx` | Rounds newest first, the end, moderator-only controls, closing after a confirmation, the open-panel button |
| `game-rounds.test.ts` | The history split into rounds |
| `locales.test.ts` | Every message exists in `en` and `pt-BR`, with the same placeholders |
| `words.test.ts` | ≥ 400 distinct single words per list; custom list parsing |
