# Date correction evidence

Source: `7bf6d4f`; approved corrective plan: `plans/date-corrections.md`.
Branch: `codex/daybound-date-corrections`, in the isolated analytics-policy worktree.
Date: 2026-10-22. No package, lockfile, App, provider or analytics changes.

## Implementation

Both date starts and timeline boundaries now use `calendarDateTransitions`.
The helper brackets explicit Intl offset changes hourly and binary-searches the
change to a millisecond. Within each constant-offset span, UTC epoch-day
arithmetic enumerates local midnight candidates. Span starts also participate,
so an offset jump can move the date backward or skip midnight. Candidate fields
round-trip, date changes compare candidate and candidate−1ms, results are sorted
and deduplicated, and bounds are half-open. A failed midnight round-trip throws
rather than silently discarding the candidate.

The bounded offset scan assumes at most one offset discontinuity per hourly
bracket in supported IANA timezone data. Intl has no transition-list API; this
is an explicit scan assumption, not a claim that arbitrary synthetic offset
functions can be reconstructed from hourly samples. In particular, two offset
changes that cancel entirely within one bracket cannot be detected this way.
Calendar-date changes themselves have no minimum-duration or monotonicity
assumption. The 72h start-of-date search is unchanged; no public date range is
narrowed and no new timezone dependency is introduced.

Existing era-aware Intl extraction is preserved. Internal epoch-day arithmetic
can cross astronomical year zero without invoking the public AD-only calendar
key validator. Exact public starts for 0001-01-01 and 0099-01-01 remain tested;
public year 0000 is still invalid.

The animation effect now updates its previous offset on every relevant effect,
including a stable fixed-date view at home midnight. Its motion key still changes
only when the view changes. A rendered test preserves the same rail, motion
wrapper and first cell at offset 44→43, then inspects the actual new Motion DOM
wrapper's initial `translateX(25px)` on the next chosen date at offset 44.

## Predecessor failures

Added the focused regressions before changing production code and ran:

```
npm exec --yes --package=node@24 --package=npm@11 -- sh -c 'TZ=UTC npm test -- src/utils/calendarDate.test.ts src/utils/timeline.test.ts src/app/components/Timeline.test.tsx'
```

Result against unchanged 7bf6d4f production code: **8 failed, 50 passed**.

- Three date-start tests returned 03:30Z instead of the first brief occurrence.
- Three model tests retained only the 03:30Z return, missing first midnight and rollback.
- The rendered St Johns divider test likewise retained only 03:30Z.
- The rendered animation test observed `translateX(-25px)` instead of +25px.

The first implementation run passed all behavioral assertions. One CSS string
comparison differed only in the last floating-point decimal
(9.733333333333334% versus 9.733333333333333%). Geometry assertions now compare
numeric CSS coordinates at 12 decimal places (10 for pixel position); exact
boundary ISO timestamps and calendar labels remain exact assertions.

## Explicit Intl historical fixtures

A locally scoped Node24 probe using `Intl.DateTimeFormat`, explicit
`America/St_Johns`, h23, and longOffset verified:

| Local date | First midnight UTC | Rollback UTC | Before/after offset | Subsequent midnight UTC |
| --- | --- | --- | --- | --- |
| 1988-10-30 | 01:30 | 01:31 | −01:30 → −03:30 | 03:30 |
| 2009-11-01 | 02:30 | 02:31 | −02:30 → −03:30 | 03:30 |
| 2010-11-07 | 02:30 | 02:31 | −02:30 → −03:30 | 03:30 |

Tests assert the exact previous millisecond, first instant, last second of the
brief date, and rollback's previous-date fields and offsets. Rails begin at
00:05Z, which prevents the predecessor's 15-minute date scan from seeing either
side of each brief appearance. Model tests assert all three exact instants,
labels, fractional indices and adjacent dates. The rendered 2009 fixture checks
all three dividers and their fractional CSS positions with nonzero dimensions.
Existing label-collision suppression remains; it hides an overlapping brief
floating label, while all date segments and dividers remain in the model/DOM.

## Passing checks

Run with locally scoped `node@24` and `npm@11` via `npm exec`:

- `TZ=UTC npm test -- src/utils/calendarDate.test.ts src/utils/timeline.test.ts src/app/components/Timeline.test.tsx` — **58/58**, three files.
- `TZ=America/Vancouver npm test -- src/utils/calendarDate.test.ts src/utils/timeline.test.ts src/app/components/Timeline.test.tsx` — **58/58**, three files.
- `TZ=Asia/Kathmandu npm test -- src/utils/calendarDate.test.ts src/utils/timeline.test.ts` — **44/44**, two files.
- `npm run typecheck` — passed both TypeScript projects.
- `npm run lint` — passed, zero warnings.
- `git diff --check 7bf6d4f` — passed.

The matrix retains Santiago skipped midnight, Havana repeated midnight,
Lord Howe half-hour DST, New York missing/repeated hours, fractional offsets,
last-cell/right-endpoint geometry, and the Kolkata/Vancouver browser-DST case.
No complete suite was run; plan009 owns integrated validation. No analytics
traffic, pushes, PRs, deployments, global runtime or model changes occurred.
The prior analytics branch remains at `922aca1`; its commits are preserved.
The supplied untracked analytics and date-review plans remain uncommitted.
Staff re-review is required before plan008 integration.
