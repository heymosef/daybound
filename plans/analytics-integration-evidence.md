# Plan 006 React/App integration evidence

Local integration in the isolated `codex/daybound-maintenance` worktree after accepted007/004. Cherry-picked both staff-approved transport commits, without source rewrites:

- `da396d49de202f8757496b00a13259bcf7296f3a` → local `cc10f91`.
- `922aca1f60f1c71cabe6d3d72e3ab9058df767cc` → local `0581ef8` (visit-denial lifecycle fix).

Read the amended006 plan and transport staff review. Compared the accepted predecessor source/config diff before editing. Primary-owned006 scope/index,008 profiling notes, analytics review and pending date-correction plan are included as documentation. Date helpers/Timeline were not edited in this phase; the separately assigned date corrections remain a prerequisite to008 and final completion.

## Implementation

`AnalyticsProvider` creates one committed controller lazily for its lifetime, retains it across ordinary parent/options rerenders, subscribes through React18 useSyncExternalStore, and starts/disposes it through the committed effect. StrictMode restarts the same controller; its current-visit denial latch survives. Injected named controller/options props support offline fixtures. Consumers without a provider use one stable disabled no-op controller and never read storage or dispatch. Public bootstrap configuration is passed explicitly with PROD/DEV/test and current hostname gates; no application .env was copied or read for this work.

All App, search, date-strip and calendar call sites use the typed allowlisted transport. Removed App's person/global-setting registration effect and editable home-city property. Home change and rename carry no properties; failed search contains only length/word counts, retaining the existing debounce and search UI. Removed its now-unused telemetry-only sanitizer; matching behavior remains unchanged. Existing enum/count/date event semantics remain, with transport bounds dropping out-of-range analytics rather than expanding payloads.

Settings adds the native menuitemcheckbox “Share usage analytics”, effective aria-checked, associated explanation, matching tokens/focus styles, and a separately named polite usage-analytics status. Saved preferences show On/Off; gated configuration/environment/DNT disables the control and says analytics is unavailable here. A persistence failure immediately shows “Off for this visit; preference could not be saved.” Failed explicit opt-in stays off; only successful persistence enables capture. No opt-in/out event is emitted. App's local-save status now has a distinct accessible name; existing notice/focus assertions remain precise when both status regions exist.

The approved transport owns independent versioned preference parsing/legacy migration; shared App persistence schemas were not changed. No SDK/bootstrap/runtime remains to add automatic capture, replay, flags, logs, config requests or identity. Normal npm uninstall removed13 packages, including @posthog/react, posthog-js and their unused @posthog/core/types/browser-common, core-js, DOMPurify and fflate graph. No force or overrides were used.

## Validation

The first focused provider/settings/search run passed18/18. Adding actual App private-fixture/startup/status scenarios passed44/44 across those four files, with typecheck/lint0. After removing SDK dependencies, the final exact command was:

```sh
npm exec --yes --package=node@24 --package=npm@11 -- sh -c 'npm test -- src/analytics/ src/app/components/SettingsMenu.test.tsx src/app/components/AddTimezone.test.tsx src/app/App.test.tsx src/app/components/DatePicker.test.tsx src/app/components/CalendarDropdown.test.tsx && npm run typecheck && npm run lint && npm run build && npm audit --audit-level=high && npm ls --depth=0'
```

All exited0. Seven files/151 tests passed:72 approved transport,6 provider/date-callsite,9 Settings,3 search,26 App,26 DatePicker and9 CalendarDropdown. Typecheck/lint0; Vite production build0 (current JS396.59kB, gzip125.99kB; no chunk-size warning); npm audit0 vulnerabilities; npm ls0 with no invalid peers. npm uninstall audited281 packages. The build number is this candidate's output, not an isolated causal benchmark of SDK removal;008 owns performance measurements.

Actual fetch interception verifies complete envelopes/options using only a fake phc token and HTTPS .invalid host. Tests exercise actual private label rename and home change, distinctive page URL/query/hash/title and row IDs, failed private search, keyboard shortcut, date-strip/calendar open/navigation/selection/close. Complete request bodies/options contain no private fixture strings or browser metadata; only exact allowlisted properties and anonymous profile/geo flags remain. No automatic event occurs on App/provider mount.

Lifecycle/UI tests cover provider rerenders after failed opt-out with stale saved true; StrictMode reuse, unmount cancellation, persistent false before first App action/reload, cross-tab disable, no-provider fallback, missing config/DEV/loopback/DNT unavailable controls, keyboard Space/Enter and Escape focus restoration, failed opt-out/opt-in persistence, recovery by successful explicit opt-in, actual Settings cancellation of a pending signal, and a search timer scheduled before opt-out producing no requests after timer/online/unload. The transport's72 tests independently cover full envelope policy, all storage failure modes, legacy exact-key cleanup, dispatch-time consent and denial-latch restarts.

Python inspection confirmed no old SDK imports/hooks in any source or tests and no unused SDK packages in the lockfile. Working and cumulative whitespace checks pass before commit. The existing React quality checklist and accessibility/writing guidance were applied: stable controller/snapshots, no behavior changes to dates or App persistence, clear preference limits, native named keyboard-operable toggle and distinct polite statuses. Actual mobile layout/screen-reader/browser interception remain009's primary-owned validation; these local tests do not claim live ingestion/CORS verification.

No real project traffic, external dashboard changes, remote CI, push, deployment, browser automation, global runtime/model setting change or full final suite was performed. Already-delivered requests cannot be recalled; the controller cancels pending signals and prevents future dispatch. If a preference write could never succeed, a later full reload has the documented browser-storage limitation; the UI does not promise durable opt-out in that case. No retries, queue, beacon, keepalive or persistent identity was introduced.
