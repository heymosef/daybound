# Integrated maintenance validation

Date: 2026-10-22. Validation owner: maintenance implementation executor.
Source candidate: `80d6be4` on local `codex/daybound-maintenance`, isolated worktree
`/Users/mohammed/.codex/worktrees/daybound-maintenance/daybound-web-app`.
Plan008 is `7feaa01`; approved cleanup55008f1 was cherry-picked as80d6be4;
approved date correction6069064 was cherry-picked as74ea93a. Earlier commits and
risk-specific approvals are linked through the plan index/evidence files.

## Status

Local command gates and fixture preparation PASS. Actual desktop/mobile CUA
browser verification and final combined-source staff review are PENDING the
primary reviewer. This is not a completed release, live-ingestion test or remote
CI result. Plans010/011 remain deferred; no feature implementation was added.

## Authoritative final command run

The integrated candidate received one clean install and one complete required
suite under locally scoped Node24/npm11. No global runtime/model settings changed.

```sh
npm exec --yes --package=node@24 --package=npm@11 -- sh -c 'node --version && npm --version && npm ci && npm run typecheck && npm run lint && npm test && npm run build && npm audit --audit-level=high && npm ls --depth=0'
```

All commands exited0, in sequence, with Nodev24.22.1/npm11.21.1:

| Gate | Actual result |
| --- | --- |
| npm ci | 280 packages added,281 audited; clean install succeeded |
| typecheck | App/tests and Vite/Vitest config projects pass |
| lint | Zero warnings, recommended and traditional hook checks pass |
| complete tests | 13 files,257 tests pass; Vitest4.1.12 |
| production build | Vite6.4.5,2022 modules; succeeds |
| audit | Zero vulnerabilities, including high/critical and lower severity |
| npm ls --depth=0 | All direct packages resolve; no invalid peer graph |

Production output: JS397865 bytes /126453 gzip; CSS48880 /10002 gzip;
index.html2027 /656 gzip. The actual disk output matches plan008 in-memory
measurement. `plans/performance-evidence.md` records before/after attribution,
render/conversion/search counts and the measured Motion reject decision.

npm reported the existing whatwg-encoding deprecation and npm11 install-script
policy notices for Tailwind oxide,esbuild andfsevents. No install policy was
changed; installation, tests and both product/fixture builds succeeded. Audit
counts are dependency-graph observations, not exploitability claims.

The complete run's local terminal output was captured at
`/tmp/daybound-final-validation.log`; it contains command/dependency results and
no environment values. This record is the durable summary; temporary logs are
not committed. No complete-suite repetition was performed after success.

## Explicit-zone matrices

All ran through the same scoped Node24/npm11 invocation and exited0:

```sh
TZ=UTC npm test -- src/utils/calendarDate.test.ts src/utils/timeline.test.ts src/app/components/Timeline.test.tsx
TZ=America/Vancouver npm test -- src/utils/calendarDate.test.ts src/utils/timeline.test.ts src/app/components/Timeline.test.tsx
TZ=Asia/Kathmandu npm test -- src/utils/calendarDate.test.ts src/utils/timeline.test.ts
```

Results: UTC3files/59tests; Vancouver3/59; Kathmandu2/44 pass. Fixed epochs retain
25 elapsed cells, fractional labels/boundaries, New York gaps/repeats, missing
Santiago midnight, repeated Havana midnight, Lord Howe transitions, skipped
Apia date, and the short-lived St Johns date/rollback. Rendered tests also prove
consumer geometry, marker/hover and fixed-preview animation direction. Actual
App lifecycle/persistence/privacy assertions are included in the complete run.

## Offline browser preparation and handoff

`node --check scripts/browser-fixtures.mjs` and
`node scripts/browser-fixtures.mjs` under scoped Node24/npm11 both exited0.
The generator compiled2024 modules from the final App/styles/provider, with
`.env` loading and public-directory copying disabled. All fetch is intercepted
before product imports; the explicit offline production context uses a fake
public token and .invalid destination. CSP also denies network connections.
This is preparation evidence; it does not prove browser actions have passed.

`git check-ignore` confirms both generated entry and output HTML are ignored.
The final fixtures reside in `node_modules/.cache/daybound-smoke/site/`.
Remote Google Fonts are intentionally blocked by fixture CSP; the normal
production build is used for font-resource inspection. No local font assets
were introduced by008.

Two loopback Python servers are ready for the primary's CUA owner:

- Production: http://127.0.0.1:4175/ — terminal session66605, serves `dist/`.
- Fixture: http://127.0.0.1:4176/?scenario=midnight&analytics=on — terminal56808,
  serves final ignored site. Port4174 was occupied; no existing server was killed.

Both shells returned HTTP200 with expected HTML. This HTTP check does not count
as browser verification. Adapt routes in `plans/browser-fixtures.md` from4174 to
4176 for this session. Separate ports preserve storage isolation. Primary owns
actual controls/screenshots/resource inventory, including desktop/mobile,
add/rename/remove/home/reorder, themes/formats, calendar across ticks/midnight,
fractional/DST cases, malformed/blocked/quota storage, intercepted envelopes,
opt-out/reload/cross-tab/cancellation and no-config behavior. Results belong in
`plans/browser-evidence.md`; before008 font observation is already there.

## Scope and local boundaries

Working and cumulative `git diff --check b77ff08` pass before this evidence commit.
Only `.env.example` exists among application environment filenames in this
isolated tree; it contains blank placeholders. Source/manifest/lockfile search
finds no old SDK imports, usePostHog,culori or removed formatter. The debug log,
guidelines scaffold and unused formatter are removed. Date helper packages
remain because real DatePicker tests still import them; no dependency was
removed solely to change counts.

All source commits remain local on the managed maintenance branch. No push, PR,
deployment, remote workflow, external dashboard change, live analytics request,
original-checkout source edit, global runtime change or model setting change was
performed by this executor. The attached worktree is retained for user review.
Primary owns final plan-status reconciliation and records the bounded/final
staff verdicts. Pending evidence must be completed before claiming the entire
maintenance goal finished.
