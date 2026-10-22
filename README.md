# Daybound

Daybound is a time zone dashboard for comparing local times across distributed teams.

## Development

Use Node24 (`.nvmrc`) and npm. Install the locked dependencies, then start Vite:

```sh
npm ci
npm run dev
```

Vite prints the local development URL. These checks run independently:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

`npm run build` writes `dist/`. To inspect that production build locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open [the local production build](http://127.0.0.1:4173). Analytics is disabled on loopback hosts. The offline browser fixtures use a separate port and output directory; see [fixture instructions](plans/browser-fixtures.md). The primary validation owner runs the complete suite once on the integrated candidate; other work uses focused checks.

## Dates and local saving

The rail contains 25 consecutive elapsed-hour cells. A selected calendar date is a preview, including when it equals today. It stays fixed across home midnight and home-zone changes until it becomes past; Today returns to the live view. Reload starts live. Missing midnight uses the first existing instant, repeated midnight uses its earliest occurrence, and a wholly skipped local date is unavailable. Fractional offsets and DST changes retain their exact instants.

Time zones, labels, themes and display settings use browser `localStorage`. Valid saved rows and fields survive partial recovery; malformed values fall back safely. If storage is blocked or full, changes can remain available for the current visit and the app displays a saving notice. It cannot promise that those changes will survive reload. Selected dates are transient.

## Optional usage analytics

The app works without analytics configuration. To configure a production build, copy `.env.example` to `.env.local` and supply a public PostHog project token and HTTPS ingestion origin:

```sh
cp .env.example .env.local
```

`VITE_PUBLIC_POSTHOG_KEY` expects a public `phc_` token; `VITE_PUBLIC_POSTHOG_HOST` expects an HTTPS origin without credentials, query, fragment or path. Vite embeds `VITE_*` values into the browser bundle; they must never contain secrets. Leave both blank to disable analytics. Development, tests and loopback hosts do not send usage events.

Settings includes an opt-out control. Analytics records only explicit allowlisted actions with bounded counts, directions and date offsets. It omits labels, search text, selected time zones, page URLs/referrers, session recording and automatic interaction capture. Requests use an ephemeral identity for the current page, omit credentials and disable person profiles and GeoIP enrichment. There is no batching, retry or unload delivery. Opt-out cancels pending requests; a request already dispatched may already have reached the server. Failed consent writes disable capture for the visit and report that the preference could not be saved. Browser privacy signals and cross-tab opt-out are respected.

## Static deployment

The existing Pages workflow validates and builds `dist/`, then publishes it on main pushes or manual dispatch. It reads the optional public analytics variables from the configured GitHub environment. `public/CNAME` carries the custom domain `daybound.work` into the static output. DNS and Pages domain settings must match that domain. Deployment and external settings changes require separate authorization; this maintenance work creates local commits only.

## Project structure

- `src/app/`: App, controls and row/rail components.
- `src/hooks/`: Clock and persistent-state hooks.
- `src/utils/`: Calendar, timeline, persistence and timezone helpers.
- `src/analytics/`: Minimal usage transport and React provider.
- `scripts/browser-fixtures.mjs`: Ignored offline smoke-page generator.
- `plans/`: Approved maintenance plans and validation evidence. Plans010/011 remain deferred designs.
