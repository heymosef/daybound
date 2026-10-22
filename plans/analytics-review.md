# Analytics transport staff review

**Verdict: APPROVE for App/provider integration, including revision `922aca1f60f1c71cabe6d3d72e3ab9058df767cc`.** The original transport commit `da396d49de202f8757496b00a13259bcf7296f3a` alone had the lifecycle blocker below; integrate both commits or their complete combined diff.

Reviewer: GPT-6 Astra, High reasoning effort. Date: October 22, 2026. Reviewed against base `94ec757` in the analytics worktree. Scope: `src/analytics/analytics.ts`, its focused tests, and `plans/analytics-transport-evidence.md`. No source edits, live requests, installs or test-suite reruns were performed by this reviewer.

## Resolved finding

### [PRIVACY-02] Preserve this visit's denial across controller restart

- **Evidence:** Original `analytics.ts:215` reread saved preference during start; `:237` disabled the snapshot on an unsuccessful opt-out write without retaining a separate in-memory denial. `dispose()`/`start()` are explicitly reusable lifecycle operations.
- **Impact:** If opt-out failed while disk still contained true, a restart after storage recovery silently re-enabled analytics despite the promised current-visit opt-out. Normal StrictMode support must not undermine that preference.
- **Effort:** S, including a focused lifecycle regression.
- **Risk:** LOW–MED; ordinary enabled StrictMode restarts must still work, while revocation survives restart.
- **Confidence:** HIGH from the concrete control flow.
- **Fix sketch and resolution:** Revision 922aca1 introduces a controller-local denial flag, preserved by dispose/start and cleared only by a successful explicit opt-in. Restart can persist the denied state as false and truthfully report successful recovery without enabling capture. I re-read the change and seven additional regressions: the failed-write/recovered-storage lifecycle, persisted false, malformed/removed consent, blocked reads, cross-tab denial and DNT revocation. The tests also prove successful explicit opt-in recovers and ordinary enabled restart remains supported.

## Approved boundaries

- Runtime event projection selects only the specific bounded integer/enum properties for known event names. Unknown events, extra text/metadata and invalid values cannot be forwarded by an untyped caller. The transmitted envelope and fetch options are asserted exactly, including the per-page UUID, profile/geo flags, omitted credentials/referrer and redirect rejection.
- Missing/invalid configuration, DEV/test, loopback hosts and DNT prevent dispatch. Consent is reread and validated immediately before each fetch, independent of eventual cross-tab event delivery. Revocation cancels already pending signals and denies further requests.
- No SDK, retries, queue, beacon, keepalive or unload delivery path exists in this module. Network failures drop silently; cancellation cannot guarantee recall of bytes already sent, and evidence states that physical limit.
- Preference parsing is strict and fail-closed. Bootstrap and explicit opt-in require successful write/readback. Failed opt-out disables immediately and reports unavailable persistence without pretending the old saved value was replaced. A new controller after a full page reload still has the documented storage limitation if no denial could ever be saved.
- Existing versioned consent has priority; otherwise the configured project's legacy opt-out is migrated before cleanup. Cleanup names exact project keys and guards failures. It does not enumerate/delete arbitrary prefixes or unrelated application storage. Both local and cookie opt-out forms are exercised.
- Stable snapshots, subscription cleanup, idempotent start/dispose and cancellation are suitable for the planned React integration. The revised in-memory denial survives reuse of the controller.

The focused tests exercise the actual mocked fetch boundary, not an adapter facade whose behavior merely repeats expectations. I inspected the recorded **72 passing focused tests**, typecheck and lint results without duplicating the validation owner's run. There is no claim of live ingestion or CORS verification.

## Remaining integration gates

Keep one stable controller instance for the page/provider lifetime; do not recreate it on ordinary settings/prop renders, which would discard the current-visit denial. Start/dispose through the committed provider lifecycle and use its effective snapshot for the settings UI. The failure message must distinguish current-visit opt-out from successfully saved preference.

Actual App/call-site tests with distinctive private labels/search text, provider/Settings keyboard and mobile behavior, removal of the old PostHog bootstrap/imports/dependencies, and intercepted browser verification remain required by plan 006. This standalone module does not yet remove the application's existing SDK. Final combined source review and plan 009 validation are still required before completion.
