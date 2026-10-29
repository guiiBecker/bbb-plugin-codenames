# Development

## Requirements

- Node 22 or later (see `.nvmrc`).
- A BBB 4.0 server (mconf-4.0-release, plugin SDK 0.1.26) where you can add plugins.

## Run against a server

```bash
npm ci
npm start                 # webpack dev server on :4701, serves /manifest.json
ngrok http 4701           # BBB only loads plugins from https URLs reachable by browsers
```

1. Create a meeting with `pluginManifests=[{"url":"https://<tunnel>/manifest.json"}]`, or add
   the plugin to `bbb-html5.yml`.
2. Join as a moderator: **Apps → Codenames → Open game**.
3. Join three more users in private windows, to fill two teams.

Notes:

- Live reload is off. Reload the BBB page after rebuilding.
- To test what a role sees, use a separate browser profile per user. The plugin keys roles by
  user id, and each join link is a new user.
- On a server you control, you can skip the tunnel. Copy `dist/` under nginx's static root
  (`/var/www/bigbluebutton-default/assets/<folder>/`) and use
  `https://<server>/<folder>/manifest.json`. An `http://localhost` manifest does not work:
  bbb-web only fetches `https` URLs on non-local hosts.

## Checks

```bash
npm run test:unit
npm run lint
npm run typecheck
npm run build-bundle
npm audit --omit=dev
```

## Adding a message

1. Add it to the component's `messages.ts`, with an English `defaultMessage`.
2. Add the same id to `public/locales/en.json` and `public/locales/pt-BR.json`.

`tests/unit/locales.test.ts` fails when an id is missing, when `en.json` drifts from the default
message, or when the two files have different placeholders.

## Changing a word list

The lists are in `src/words/`. `tests/unit/words.test.ts` checks that each list has at least 400
words, all distinct with accents and case ignored, single words, and short enough for a card.
