# Daybound implementation plans

Source audited/planned at `b77ff08`; October 22, 2026. [Original audit](audit-2026-10-22.md).

## Accepted user decisions

- Implement all nine maintenance findings. Optional features receive plans only and remain deferred.
- Preserve the exact selected calendar date across home midnight/home-zone changes. A selected date equal to home today stays in day view; once past, return to live Today. Clicking Today explicitly goes live. Reload begins live.
- Keep minimal explicit production analytics enabled, disable autocapture/replay/logs, add a persistent opt-out. No real analytics traffic during verification.
- Keep the fixed25 elapsed-hour comparison rail, including DST transitions, with accurate fractional offsets and exact date boundaries.
- Staff plan review: GPT-6 Astra, High effort. Plan go-ahead recorded before implementation; final source also approved. No global model/default changes.
- Local commits only: attached worktree `/Users/mohammed/.codex/worktrees/daybound-maintenance/daybound-web-app`, branch `codex/daybound-maintenance`. No pushes, PRs, remote changes or deployment. Original checkout stays available.

## Execution order and status

| Plan | Title | Priority | Depends on | Status |
|---|---|---|---|---|
| [001](001-verification-baseline.md) | Verification baseline / CI gates | P1 | — | DONE (238ff08; focused/static/install/audit verified) |
| [002](002-dependency-runtime-security.md) | Dependency security / supported runtime | P1 | 001 | DONE (238ff08; focused/static/install/audit verified) |
| [003](003-calendar-navigation.md) | Stable calendar browsing | P1 | 001 | DONE (fa5d857; lifecycle regressions reviewed) |
| [005](005-persistence-recovery.md) | Validated storage / recovery | P1 | 001 | DONE (94ec757; recovery/preservation tests reviewed) |
| [007](007-fixed-calendar-selection.md) | Fixed calendar selection | P1 | 001,003; App integration after005 | DONE (c4bf6e2,7bf6d4f +74ea93a integrated corrections; staff APPROVED) |
| [004](004-fractional-timezone-timeline.md) | Accurate rail, fractional zones / DST | P1 | 001,003,007 | DONE (c4bf6e2,7bf6d4f +74ea93a integrated corrections; staff APPROVED) |
| [006](006-minimal-analytics-opt-out.md) | Minimal analytics / opt-out | P1 | 001,002,005 | DONE (bb1c2db +transport commits; staff APPROVED) |
| [008](008-render-performance.md) | Clock/render/startup optimization | P2 | 001–007 | DONE (7feaa01; measured work reduction;446ca3a label correction) |
| [009](009-cleanup-docs-final-verification.md) | Cleanup, onboarding / final validation | P2 | Cleanup after002; final gates after001–008 | DONE (80d6be4; final commands/browser/staff PASS) |
| [010](010-portable-configuration.md) | Portable configuration design | P3 | 005,009 | DEFERRED: plan only |
| [011](011-working-hours-overlap.md) | Working-hours overlap design | P3 | 004,005,007,009 | DEFERRED: plan only |

Numbers retain audit traceability; dependencies control execution. Execute date-state007 before timeline004.

## Parallelism and ownership

1. One toolchain owner executes001/002 as a combined bootstrap phase, owning package/lockfile/workflows and config types. Repair selectors/draft static checks first, resolve compatible versions, then mark both green.003 and isolated parser/hook work005 start after that combined baseline.
2. Date owner executes003 →007 →004. Persistence005 owns its hook/parsers and App/status integration; land that integration before007. Analytics006 can prepare after002, integrate after005, and reconcile App changes after date edits. One App integrator; no simultaneous writes there.
3.008 follows stable date/storage/privacy behavior. Clock/memoization must not race time fixes. Independent README/log cleanup from009 may be drafted alongside source work and reconciled to final behavior.
4. One owner runs complete final validation009. Implementers own focused checks; reviewers inspect diffs/tests and risk-specific behavior. Do not automatically duplicate complete suites. Compatible reviewed changes may share one local branch.

## Review and evidence

- Plan review APPROVED by GPT-6 Astra / High before source edits: `plans/staff-review.md`.
- Implementation COMPLETE:001–009, including staff/browser-discovered corrections.
- Validation PASS: [commands and scope](validation.md), [actual browser](browser-evidence.md), [final staff review](final-staff-review.md).
- Measurements recorded: [render/conversion/bundle evidence](performance-evidence.md); final layout build JS126447gzip bytes, about33% below original188408.

All work remains on the local maintenance branch in the attached worktree. Original checkout source/main is unchanged; only planning artifacts were copied back. One complete257-test run passed at80d6be4, followed by36 focused tests/typecheck/lint/build for the single desktop spacing delta446ca3a. Audit:0 vulnerabilities. No push, PR or deployment. Optional010/011 remain deferred. See requirements.md for the completion map.

## Considered and rejected

- Audit severity counts do not establish public-site RCE; preserve reachability notes.
- No blanket framework major migration/App rewrite; patches and measured changes first.
- No bundle-saving claim for unimported culori.
- No unrelated branch deletion/history rewrite; log removal affects future commits only.
- Optional feature policy questions remain deferred discovery, outside maintenance implementation.

## Subsequent local integration and search analytics

The maintenance work was subsequently merged into the original checkout locally.
The user then requested linked city-search analytics, including a filtered sample
of unrecognized failed words under normal PostHog retention. See the
[implementation and verification record](search-analytics-implementation.md) and
[report setup guide](../docs/search-analytics.md). The earlier maintenance privacy
scope and checkout-state statements above describe that earlier milestone.
Optional features remain deferred; all work remains local.
