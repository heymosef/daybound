# Plan009 cleanup and browser-fixture preparation

Date: 2026-10-22. Source: `bb1c2db`. Branch: `codex/daybound-cleanup`.
This is the bounded preparation slice; the primary integrator owns integrated
final validation, the plan index and actual desktop/mobile CUA smoke evidence.
The amended plan009 was read from the primary maintenance worktree without
replacing this branch's existing planning documents.

## Changes

- Removed the tracked `.cursor/debug-99805d.log` and unused guidelines template.
  Added narrow Cursor/npm diagnostic-log ignores.
- Removed unused `formatTimezoneTime` and its formatter import after checking
  call sites. Removed obsolete Make-only comments from Vite configuration.
- Added a blank analytics `.env.example`, complete development/operation README,
  and AGENTS.md preserving the user's resource/model instructions verbatim,
  followed by project commands and local-only maintenance boundaries.
- Added `scripts/browser-fixtures.mjs` and `plans/browser-fixtures.md`. The
  generator uses Vite programmatically to compile the real App/styles/provider
  into a separate ignored directory, with no product controls or source changes.

## Dependency decision

No package or lockfile changes. `src/app/components/DatePicker.test.tsx` still
imports both `date-fns` and `date-fns-tz`; removal would break real test consumers.
The primary explicitly confirmed retaining them instead of expanding this slice
into test rewrites. Neither unused `formatTimezoneTime` nor culori references
remain in source/package consumers after cleanup.

## Fixture behavior and limits

Generated entries: `node_modules/.cache/daybound-smoke/entries/`.
Generated output: `node_modules/.cache/daybound-smoke/site/`.
Both paths are ignored; the generator starts no server and never reads .env.
Serve fixture output on127.0.0.1:4174, separate from product dist on4173. Full
commands, query routes and actual DOM controls are in `plans/browser-fixtures.md`.

The bootstrap runs before dynamic App/provider imports. It installs deterministic
Date/Date.now, seeded fractional/DST rows and corrupt/blocked/quota storage modes.
Minute/day/focus controls are real DOM buttons; native timers and animations
remain active. Product date/home controls drive the actual React behavior.

Analytics mode injects a fake public token, .invalid ingestion host, production
context and deterministic false DNT callback solely inside the offline fixture.
Every fetch is intercepted, unexpected fetch rejects, and CSP additionally blocks
all network connections and external resources. Request envelopes/options,
pending/completed counts and AbortSignal observations are readable DOM content.
Normal product localhost policy is unchanged. Baseline external Google Fonts
imports are blocked by fixture CSP; main008 may supply local font assets.

The shell includes a simulated cross-tab denial and local request-completion
button. It sends no live traffic. No browser, Playwright or CDP was used in this
preparation slice; actual CUA evidence and integrated behavior remain primary's
responsibility. Rebuild the fixtures after integrating008 so they contain the
final clock/date/font source.

## Focused checks

All commands ran with locally scoped `node@24` and `npm@11` via `npm exec`.

- `node --check scripts/browser-fixtures.mjs` — passed.
- `node scripts/browser-fixtures.mjs` — passed; Vite6.4.5 compiled2024 modules
  including real App and AnalyticsProvider chunks into the ignored fixture site.
- A standalone jsdom bootstrap check — passed clock/minute/day controls, seeded
  home/rows, corrupt JSON, blocked localStorage getter, quota failures, explicit
  production fixture injection, loopback-disabled default options, intercepted
  pending requests, local completion, AbortSignal rejection/count updates,
  unexpected-fetch rejection and persisted cross-tab denial.
- `npm run typecheck` — both projects passed.
- `npm run lint` — passed with zero warnings, including the generator.
- `git check-ignore` — confirmed generated entry/output HTML are ignored.
- `git diff --check` — passed.
- Source/import inspection confirms date libraries remain used only by the
  existing DatePicker test consumers and their manifest declarations.

No complete test suite, audit, product dist build, browser smoke, clean install,
external traffic, push, PR, deployment, runtime/model change or primary plan-index
edit occurred. The date correction commit remains on its prior branch at
`6069064391cf3dadf3ad1445d59e0c1de5d3fbae`. Before switching to this branch, both
formerly untracked review plans were copied to
`/var/folders/_c/0y_t57qx06z55bk00ck44c080000gn/T/daybound-cleanup-plans-56cdh1wi/`;
`bb1c2db` already tracks those same planning documents.
