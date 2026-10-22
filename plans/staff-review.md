# Senior staff plan review

**Verdict: APPROVE — explicit go-ahead to implement plans 001–009.** Plans 010–011 are approved as deferred design artifacts only; they do not authorize feature implementation.

Reviewer: GPT-6 Astra, High reasoning effort, as requested. Reviewed October 22, 2026 against source `b77ff088e2b5eafc88f4a31e1255b0dcd76eab7b`. This verdict follows re-reading the amended plans after the findings below were addressed. It is approval of the execution plan, not certification of an implementation that has yet to be written.

Implementation is authorized only in `/Users/mohammed/.codex/worktrees/daybound-maintenance/daybound-web-app`, on `codex/daybound-maintenance`, with local commits. No push, PR, deployment, external dashboard change, or global runtime/model setting change is authorized. The original checkout remains available; review/planning documents may live in its `plans/` directory.

## Review basis

Read README, all eleven numbered plans, the audit, requirements map, the improve plan template and finding format. Inspected the actual App, calendar/date controls, timeline/row geometry, storage/clock hooks, timezone helpers, analytics entry point and call sites, settings controls, package manifest, Vite/Vitest configuration and Pages workflow. Inspected the installed PostHog 1.352.0 request/consent implementation and official capture documentation. Ran only small, read-only timezone probes; no install or complete test suite was run. The reported 27-pass/2-fail baseline is audit evidence, not an independently rerun result.

The accepted user decisions are preserved: a fixed YYYY-MM-DD survives midnight/home-zone changes, equal-today remains a preview, past dates and explicit Today return live, reload begins live; the rail stays 25 elapsed-hour cells; production analytics contains only minimal explicit events with opt-out; both optional features remain plans only. No additional material user question is needed before maintenance implementation.

## Findings resolved before approval

### [PRIVACY-01] Replace the SDK queue assumption with an enforceable transport

- **Evidence:** `src/main.tsx:7` initializes the SDK using defaults. Installed `node_modules/posthog-js/lib/src/posthog-core.js:2960` implements opt-out through consent/persistence; `:978` applies `before_send` before requests enter queues; `:705` sends requests without another consent check. `request-queue.js` and `retry-queue.js` retain timer/unload delivery paths.
- **Impact:** Mocking `opt_out_capturing` and checking capture calls would not prove that queued or retried events stop after opt-out. Filtering before queueing cannot solve later transport dispatch.
- **Effort:** M, including transport/lifecycle integration tests.
- **Risk:** MED; analytics delivery and preference behavior change, so complete request envelopes and cancellation require tests.
- **Confidence:** HIGH; inspected the installed implementation directly.
- **Fix sketch and resolution:** Amended 006 removes the SDK runtime and uses a typed allowlisted HTTP transport with no batching, retry, beacon, keepalive or unload delivery. Requests use an ephemeral per-page identity, disable person processing, omit URL/referrer metadata, and use cancellable fetches. Consent is checked at dispatch, in-flight requests abort on opt-out, and cross-tab opt-out is handled. This is consistent with PostHog's documented [capture endpoint](https://posthog.com/docs/api/capture) and [anonymous API events](https://posthog.com/docs/data/anonymous-vs-identified-events). Already-dispatched requests cannot be guaranteed recalled; the plan states this limit.
- **Required implementation proof:** Exercise actual transport interception, pending fetch cancellation, advanced timers/online/unload after opt-out, no-config/DEV/loopback cases, whole envelopes containing distinctive private-string fixtures, and independent read/write/quota failures. An unsuccessful preference write disables capture for this visit and reports that persistence failed; opt-in requires successful persistence. The user must never be promised durable storage when the browser rejects writes.

### [TIME-01] Avoid browser-local synthetic Dates for zoned fields

- **Evidence:** `src/app/components/Timeline.tsx:149` and `:350`, plus `TimezoneRow.tsx:75`, format shifted Dates. With browser TZ `America/Vancouver`, instant `2026-03-07T21:00:00Z` in `Asia/Kolkata`, both `format(toZonedTime(...))` and `formatInTimeZone(...)` produce 03:30 with installed date-fns-tz. Explicit-zone Intl produces the correct 02:30.
- **Impact:** A browser's own DST gap can corrupt another zone's clock, rail label or calendar fields even after removing startOfHour rounding. Merely adding New York DST fixtures does not necessarily exercise this failure.
- **Effort:** M, within the existing date/rail work.
- **Risk:** MED; a shared field helper must cover row clocks, marker, rail and calendar consumers consistently.
- **Confidence:** HIGH; reproduced with a fixed epoch and fixed browser timezone.
- **Fix sketch and resolution:** Amended 004/007 require explicit-zone Intl fields, UTC calendar arithmetic, and the concrete cross-zone regression across model and rendered consumers. This keeps the same library major versions while avoiding the demonstrated conversion path.

### [TIME-02] Define real date starts and complete fractional boundary geometry

- **Evidence:** `src/app/App.tsx:277` converts local midnight through fromZonedTime; `Timeline.tsx:148` discovers date changes from hourly samples and `:358` treats hour zero as midnight. A direct probe of `fromZonedTime('2026-09-06T00:00:00', 'America/Santiago')` returned `2026-09-06T03:00:00Z`, which formats as the previous date at 23:00.
- **Impact:** Missing midnight can anchor a selected date to the wrong date. Integer sample boundaries misplace half/quarter-hour transitions and can miss a boundary inside the final rendered cell.
- **Effort:** M, including adversarial timezone fixtures and rendered geometry assertions.
- **Risk:** MED; search bounds, repeated/missing midnights and half-open endpoint treatment need explicit verification.
- **Confidence:** HIGH; source inspection plus fixed-epoch reproduction.
- **Fix sketch and resolution:** Amended 007 defines the earliest representable instant of the selected date, with round-trip validation, earliest repeated midnight and safe rejection of an entirely skipped date. Amended 004 defines `[railStart, railStart + 25h)`, searches through the final cell, and positions boundaries by elapsed fractional hours. Initial date-segment labels are distinct from true midnight dividers. Tests include Santiago, Havana and Lord Howe, as well as New York and fractional zones; rendered tests must give the container/rail nonzero dimensions. The selected fixed rail remains intact through 23/25-hour local days.

### [EXECUTION-01] Make toolchain bootstrapping possible without bypassing validation

- **Evidence:** `package.json:6` has no static scripts; Vite/Vitest configs import plugin types from the existing dependency graph. Original 001 omitted both configuration files from its edit scope while requiring them to typecheck; 002 originally required all of 001 to finish before reconciling package versions.
- **Impact:** Pre-existing plugin/type incompatibilities could create an artificial ordering deadlock or encourage casts, exclusions or semantic refactors just to make the baseline green.
- **Effort:** S for plan corrections; toolchain work remains its original estimate.
- **Risk:** LOW; no extra product scope.
- **Confidence:** HIGH for the scope/order inconsistency; no claim that a particular compiler failure was reproduced.
- **Fix sketch and resolution:** Amended 001/002 are one owner-controlled bootstrap phase, explicitly permit config type repairs, and require a combined green baseline before other source work starts. Traditional hooks correctness rules are sufficient; adopting compiler-oriented lint rules is not permission for a baseline behavioral rewrite.

## Coverage of the complete plan set

| Plan | Assessment and execution emphasis |
|---|---|
| 001 | Approved. Narrow selector repair preserves expectations; strict source/test/config checking and unprivileged PR/Pages gates establish useful proof. |
| 002 | Approved. Compatible updates, supported locally scoped Node, immutable action references and deploy-only write permissions are sound. Recheck advisories; do not confuse package counts with demonstrated public exploitability. |
| 003 | Approved. Calendar opening/selection lifecycle is independent of clock frequency. Advancing now while browsing and reopening the selected month are the right regressions. |
| 004 | Approved after amendments above. Fractional boundaries, exact instants, accessible repeated-hour offsets and actual rendered geometry are required, not helper-only proof. |
| 005 | Approved. Per-key validation, partial legacy migration, stable IDs/order/labels, guarded storage access and visible failure status address the actual startup/recovery defects. Functional updater effects must remain safe under StrictMode. |
| 006 | Approved after transport redesign. Direct HTTP is a bounded implementation choice within the user's analytics policy. SDK removal stays with the single manifest owner. |
| 007 | Approved after explicit-zone/date-start amendments. Live mode and selected-today must remain separate throughout App and controls. Date selection remains transient. |
| 008 | Approved. Clock alignment/resume tests and measured conversion counts justify optimizations. Run after correctness stabilizes; measure the SDK removal separately and do not reintroduce it to explore lazy loading. Optional Motion changes may be rejected for insufficient benefit. |
| 009 | Approved. One final validation owner, real desktop/mobile smoke, intercepted analytics, honest evidence, local commits and final diff review are appropriate completion gates. |
| 010 | Approved as planning only. Strict import validation/preview must not silently reuse tolerant storage recovery to discard invalid imported records. Merge/replace and transfer UX remain deferred decisions. |
| 011 | Approved as planning only. Future interval calculations must include every row-local date intersecting the absolute rail. Overnight shifts, DST policies and participation remain deferred discovery. |

Ownership/order is coherent: combined 001/002 baseline; persistence integration before 007; date owner 003 → 007 → 004; analytics reconciled through one App integrator; 008 after stable behavior; 009 owns complete final validation. Parallel preparation must not become concurrent writes to App or package/lockfile.

## Conditions of execution

These are implementation acceptance conditions already expressed by the amended plans, not unresolved permission requests. Keep the timezone regressions and transport-boundary tests as release blockers; do not substitute mocks that merely repeat the proposed implementation. Keep pure field/geometry helpers bounded and deterministic; do not rely on a formatter cache to mask incorrect conversion. Preserve the documented storage failure limits. Stop for incompatible dependency migrations, unsupported date cases, privacy-contract weakening or substantive unplanned scope expansion.

The final implementation still needs its focused checks, one integrated required suite, browser evidence and independent staff diff review before the work is reported complete. This review authorizes starting that work now.
