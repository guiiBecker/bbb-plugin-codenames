# bbb-plugin-codenames

BigBlueButton plugin (BBB 4.0, SDK `0.1.26`) for playing **Codenames** in a meeting. A
moderator opens a board in everyone's media area. Two teams, red and blue, each with a
spymaster and agents, play in real time. The key map stays secret: the server only ever
sends it to the spymasters' (and the host's) browsers.

Built on the structure of [`bbb-plugin-characters`](https://github.com/mconf/bbb-plugin-characters):
the same SDK version, dependencies, build, lint, tests, i18n and packaging.

## Documentation

- [Architecture](docs/architecture.md): modules, data channels, the host, and how the key map is
  kept secret.
- [Development](docs/development.md): running against a server and the checks.

## How it works

- **One "Codenames" entry** in the apps gallery (and the sidebar, once pinned):
  - With no game open, moderators get it to open one (a modal).
  - Once a game is open, the entry becomes the game's **sidebar panel**, for everyone: the
    **teams** (spymaster, agents, cards left, the team in turn highlighted), the **history round
    by round** (each clue, then the cards revealed with it, newest round first)
    and a **Show the board** button for whoever hid it. Moderators also get **End match**,
    **Close game for everyone** (after a confirmation), the participant organizer and **Take
    over as host**.
  - The panel opens by itself when a match starts. The "Rounds and controls" button above the
    board opens it too.
- **Media area:** the board replaces the presentation for everyone. Each person can switch back
  with **Show presentation** / **Show Codenames**. Hiding is local and never ends the game.
- **Lobby:**
  - Nobody picks a team. A moderator presses **Draw the teams**, and everyone in the meeting is
    split into two balanced random teams, all as agents, moderators and the host included.
  - In each team, the first player to press **I want to be the spymaster** gets the seat; they
    can step down to free it. Players can leave their team. Late arrivals are spectators until
    the moderator draws again or seats them with the organizer.
  - Moderators can still seat anyone with the organizer, and pick the word list: Portuguese
    (Brazil, 610 words, the default), English (462 words), or a pasted list of at least 25
    words.
  - A match starts only when each team has exactly one spymaster and at least one agent.
- **Match:** the rules of the board game.
  - 25 cards. The starting team is drawn at random and has 9 cards, the other team 8. There are
    7 neutral cards and 1 assassin.
  - **No repeated words across matches:** the game remembers the words of the last three boards
    (75) and draws the next board among the others. Older words go back into the draw. With a
    custom list too short for that, the board is completed with the words used longest ago.
    Closing the game clears the memory.
  - The spymaster in turn gives one word and a number from 0 to 9, or unlimited. The word may not
    be, contain or be part of a visible word; accents and case are ignored.
  - **Team vote:** agents of the team in turn click the cards they think match the clue (as many
    as they like; a second click takes the vote back). The votes are listed under the board, with
    who voted, for everyone to follow. When any agent presses **Guess**, the card on top of the
    list is revealed: the most voted, or on a tie the one voted first. Votes for other cards stay
    for the next guess; they are cleared when the turn ends.
  - The team may guess up to the number plus one; 0 and unlimited allow unlimited guesses.
  - A wrong color or a neutral card ends the turn. After the first guess, agents may end the turn
    themselves.
  - The assassin makes the revealing team lose. A team wins when all its cards are revealed, even
    by the other team.
  - The screen shows the team in turn, the phase, the clue, the guesses left, each team's cards
    left and the history.
- **End:** the winner, and the whole key map shown to everyone. A moderator can start a new match
  with the same teams, or go back to the lobby.
  - **New match, same teams:** each team gets a new spymaster drawn at random from its agents
    (present ones first), and the old spymaster becomes an agent.
  - **Who starts alternates** from one match to the next, also after going back to the lobby. The
    first match of a game draws it. The starting team always has the 9 cards.
- **Layout:** the score and the clue bar (clue, number, guesses left, end turn) sit above the
  board. The board is centered, with the team's votes and the Guess button right under it.
- **Late joiners** are spectators until a moderator seats them, including during a match. A
  **reload** restores everything from the data channels.

## Accessibility

- Card types never rely on color alone. Each has an icon and a texture: red is a diamond on
  diagonal stripes, blue a circle on dots, neutral a bar on fine lines, the assassin a skull on a
  crosshatch.
- Cards are buttons whose accessible name says the word and, once known, the type. Disabled cards
  use `aria-disabled`, so screen readers still read them.
- A click on a card only votes; revealing takes the separate Guess button, so a stray click does
  not reveal one. A card's accessible name includes its votes, and `aria-pressed` says whether
  the viewer voted for it.
- The phase and the clue are announced in live regions.
- The layout follows the width of the media area, not the window. The side panel moves under the
  board, and the cards shrink, in narrow areas and on phones.

## Build

```bash
npm ci
npm run test:unit      # vitest: rules, sync with a simulated server, UI
npm run lint
npm run typecheck
npm run build-bundle   # dist/BbbPluginCodenames.js + manifest.json + locales/
npm audit --omit=dev   # must be clean
```

`dist/` is everything that has to be hosted: the bundle, `manifest.json` and `locales/`. They
must stay side by side, because the manifest refers to them by relative paths.

## Hosting the bundle

Any static HTTPS host works. The same rules apply to all of them:

- The BBB server must reach `manifest.json` when a meeting is created.
- Browsers must reach the bundle and `locales/`.
- `locales/` is fetched with `fetch`, so a host on another origin must send
  `Access-Control-Allow-Origin`.
- bbb-web fetches the manifest itself and only accepts `https` URLs on non-local hosts
  (`fetchUrlSupportedProtocols` and `fetchUrlAllowedLocalHosts` in `bbb-web.properties`). A
  manifest at `http://localhost:…` or `http://127.0.0.1:…` is silently ignored, and the meeting
  starts without the plugin.

The usual setup is on the BBB server itself:

- **Debian package:** `debian/` builds a package that installs `dist/` into
  `/var/www/bigbluebutton-default/assets/plugins/bbb-plugin-codenames/`. The URL is then
  `https://<server>/plugins/bbb-plugin-codenames/manifest.json`.
- **By hand:** copy `dist/` to that same folder.

## Registering the plugin

Add it to the client settings, in `/etc/bigbluebutton/bbb-html5.yml`, then restart
`bbb-apps-akka` and `bbb-web`:

```yaml
public:
  plugins:
    - name: BbbPluginCodenames
      url: https://bbb.example.com/plugins/bbb-plugin-codenames/manifest.json
      settings:
        defaultWordList: pt-BR   # or en
        debug: false
```

Or per meeting, with the `create` API parameter:

```
pluginManifests=[{"url":"https://bbb.example.com/plugins/bbb-plugin-codenames/manifest.json"}]
```

For Mconf deployments, also add the plugin to `mconf/mconf-ansihub`
`playbooks/bigbluebutton-plugins-build.yml` so it is built and deployed with the others.

### Settings

| Setting | Type | Default | Meaning |
|---|---|---|---|
| `defaultWordList` | string | `pt-BR` | List selected when a game opens: `pt-BR` or `en` |
| `debug` | boolean | `false` | Lowers the plugin logger to `debug` (logs every applied or refused action) |

The `requiredSdkVersion` is `~0.1.26`, the SDK of mconf-4.0-release. A server with an older SDK
fails to load the plugin.

## Security model

- **Who decides:** the moderator who opens the game is its **host**. The host's browser holds the
  complete state, key map included. It validates and applies every action and publishes the
  result. Everyone else only sends intents to the host.
- **How the key stays secret:** the key map is pushed to the data channel with
  `receivers: [host, red spymaster, blue spymaster]`, by user id. BBB stores such an entry as
  private, and Hasura delivers it only to those users (`v_pluginDataChannelEntry_private`).
  - The agents' browsers never receive it, so DevTools has nothing to show.
  - Everyone else learns a card's color only when the card is revealed.
  - The full key is published when the match ends.
- **Trust:** roles are bound to user ids, never names.
  - The game state is accepted only from the host it names.
  - An intent's author is the entry's `createdBy`, never a payload field.
  - Turn actions carry the version they were based on. When two agents click at once, the second
    action is stale and is dropped.

See [architecture](docs/architecture.md) for the details.

## Known limitations

- **The host's browser holds the key map.** That is why the host can be a spymaster or a
  spectator but never an agent, and the plugin enforces it. A dishonest host could still read the
  key and share it. Removing that trust needs a server-side referee: a small service behind
  bbb-plugin-server. That is a possible next step.
- **The host leaving pauses the game.**
  - The match resumes when the host comes back; a reload is fine.
  - Another moderator can **take over**: a new lobby with the same teams. The running match is
    lost, because its key map was only sent to the previous host and the spymasters.
- **One host tab.** If the host opens the meeting in two tabs, both apply actions. The version
  check keeps the state consistent, but avoid it.
- **Someone who rejoins with a new join link** gets a new user id and comes back as a spectator.
  A reload keeps the seat.
- **Latency:** data channels reach other clients through Hasura live queries (~0.3–1 s). That is
  fine for a turn-based game.
- **Server-side copies of the key:** akka also broadcasts data-channel events on the server's
  internal bus (Redis). The key is not visible to clients, but a server administrator, or a
  webhook consumer configured to receive plugin events, could see it.
- **Not in this version:** agents marking a suggested card for their own team. This fits the same
  design: an intent sent to the team's members only.
- **"Codenames"** is a trademark of Czech Games Edition. The display name lives in the locale
  files (`app.name`) if a deployment needs another one. The word lists were written for this
  plugin; they are not the board game's lists.

## Usage logging

`plg_started` is logged when the board starts being shown on a client, and `plg_stopped` when it
stops (hidden, closed, or plugin unmounted). Other log codes start with `codenames_`; see
`src/commons/constants.ts`.
