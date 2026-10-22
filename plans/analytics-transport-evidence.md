# Analytics transport and preference evidence

Completed October 22, 2026 in the explicitly assigned independent worktree
`/Users/mohammed/.codex/worktrees/daybound-analytics-policy/daybound-web-app`, branch
`codex/daybound-analytics-policy`, based on `94ec7575878668772ca47e8fd79918dce18c1903`.
Read approved plan 006 and staff review in full. The source comparison with
`b77ff08` showed the expected toolchain, calendar lifecycle, and persistence
predecessors. Existing explicit event names and primitive property names were
checked against actual call sites. No call site, provider, manifest, lockfile,
shared persistence implementation, dashboard, or primary checkout was changed.

## Contract for the integrator

`createAnalytics({ token, host })` returns an `AnalyticsController`:
`capture`, `getSnapshot`, `subscribe`, `setEnabled`, `start`, and `dispose`.
`AnalyticsEvents` supplies the typed event/property contract. Call `start` from
the committed provider lifecycle and `dispose` on cleanup; both are idempotent
and the controller can restart during React StrictMode. No capture is possible
before `start`. `getSnapshot` returns a referentially stable object until state
changes, suitable for `useSyncExternalStore`. The initial snapshot is disabled
and preference unavailable. Snapshot fields are effective `enabled`,
`preferenceStatus` (`saved`/`unavailable`), and configuration/environment/DNT
`available`. A saved preference does not override a disabled environment.

Pass the two existing Vite public configuration values as token/host. Default
environment detection rejects Vite DEV and test modes, and real location rejects
localhost, its subdomains, IPv4 127/8, and IPv6 loopback. Test-only options allow
offline production/hostname/storage/DNT policies to be exercised. Missing or
invalid public token/HTTPS origin disables capture. Hosts with credentials,
paths (including normalized path ambiguity), query, or fragment are rejected.

Home changes, renames, and calendar opening carry no user properties. Remaining
event fields are projected explicitly at runtime. Integers outside these bounds
drop the event: timezone count 0–100, query length 0–1000, query words 0–100,
date offset ±3660 days, and month distance/offset ±120 months. Enum fields are
checked exactly. These bounds deliberately discard unusual analytics rather than
expand the transmitted data. Editable labels, search text, canonical timezone,
URLs/referrers, people/device/location properties, and arbitrary extra fields
are never projected. No opt-in or opt-out event is generated.

`daybound:analytics:v1` stores only `{ "version": 1, "enabled": boolean }`.
Bootstrap strictly reads the preference and confirms write/readback before
enabling any event. Malformed existing preferences fail closed without being
overwritten. Opt-in requires a successful write/readback. Opt-out disables and
aborts immediately even if persistence fails; the snapshot reports unavailable,
so the UI must say **Off for this visit; preference could not be saved**, rather
than claiming durable success. A failed write can leave an old true value on
disk; a later reload can resume only if storage works again, as documented in
the plan. Immediately before every fetch, consent is read and validated again;
missing, false, malformed, or inaccessible storage disables/cancels capture.
Cross-tab storage events can disable capture, but never enable it.

Before legacy cleanup, an absent versioned preference migrates explicit SDK
opt-out from its exact configured-token localStorage/cookie consent key. An
existing versioned preference has priority. Installed SDK source
`posthog-js/lib/src/consent.js`, `storage.js`, `sessionid.js`,
`posthog-persistence.js`, and `@posthog/core/src/utils/type-utils.ts` established
the default exact key names and false/0/no primitive forms (including stored
JSON strings). Cleanup targets only the token's identity/consent, cookie
metadata/identity-pending, window/primary-window, and session-registered keys in
local/session storage and root-path host/ancestor-domain cookies. It never
enumerates/deletes arbitrary prefix matches or app settings. Persistence failure
does not erase old consent; cleanup failure also fails closed. SDK private
implementations are neither imported nor called at runtime.

## HTTP schema basis and transport

Read the official [capture API](https://posthog.com/docs/api/capture),
[anonymous-event documentation](https://posthog.com/docs/data/anonymous-vs-identified-events),
and [troubleshooting](https://posthog.com/docs/product-analytics/troubleshooting).
The capture API specifies public POST `/i/v0/e/` with top-level `api_key`,
`event`, `distinct_id`, optional ISO timestamp and properties. Anonymous-event
documentation specifies an unlinked random identity reused during the visit
and `$process_person_profile: false`.

The adapter uses that single-event envelope, `$geoip_disable: true`, a fresh
in-memory UUID per active visit, `Content-Type: application/json`,
`credentials: omit`, `referrerPolicy: no-referrer`, and `redirect: error`.
Disabling/disposal clears the identity and aborts all in-flight signals. There
is no SDK import, batch/queue, timer, retry, online/unload handler, beacon,
keepalive, or persistent identity. Failed fetches are dropped silently. Only the
global actual fetch boundary was intercepted in tests; no live ingestion
request or test event was sent to the user's project.

## Verification

Installed the unchanged existing lockfile with locally scoped Node 24.22.1 and
npm 11.21.1:

```
npm exec --yes --package=node@24 --package=npm@11 -- sh -c 'node --version && npm --version && npm ci'
```

Result: 293 packages installed, 294 audited, 0 vulnerabilities. npm reported
four existing install-script declarations; no dependency files were changed.

Final focused/static checks (exit 0):

```
npm exec --yes --package=node@24 --package=npm@11 -- sh -c 'npm test -- src/analytics/analytics.test.ts && npm run typecheck && npm run lint'
```

- Vitest: **1 file passed; 65 tests passed**. Offline fake public token and
  `.invalid` host only. Full request bodies/options/headers assert exact fields
  and absence of distinctive private fixtures. All event projections, invalid
  config/environments/DNT, reload opt-out, malformed preference, getter/read/
  write/quota/silent write failure, transient truthful status, legacy migration,
  narrowly scoped cleanup, cross-tab changes, immediate stored-consent changes
  without storage events, pending cancellation, post-opt-out timers/online/
  unload/pagehide silence, failure-without-retry, UUID rotation, stable
  subscription snapshots, and reusable cleanup are covered.
- Strict source/test/config TypeScript checks passed.
- ESLint with `--max-warnings 0` passed.
- `git diff --check 94ec757` passed after staging all scoped new files.

Initial focused run: 58/59 passed; one test fixture incorrectly assumed jsdom
provided a `navigator.doNotTrack` getter. Replaced that fixture with a scoped
global stub. The next complete focused/static run passed 59/59. The final run
passed 65/65 after the primary requested stronger per-dispatch storage checks
and their regressions. No production policy or test assertion was weakened.
No complete suite was run; the integration validation owner retains that gate.

## Limits and remaining integration work

Already-delivered network requests cannot be recalled; browser/ingestion servers
necessarily receive requests already sent. Abort governs pending requests and
opt-out prevents future dispatch, without promising retroactive deletion.
Live PostHog delivery/CORS was not tested. Delivery is intentionally best-effort,
with no retry, and data is not linked across visits.

The primary integrator owns React lifecycle/UI, actual call-site private-fixture
tests, and SDK dependency removal. This slice alone does not replace the old app
bootstrap. The isolated commit must be inspected/cherry-picked and integrated
before plan 006 is complete.
