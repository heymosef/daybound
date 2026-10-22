# Staff-directed corrections to plans004/007

Status: APPROVED by GPT-6 Astra/High; implement before008. Original plans and user scope remain unchanged. Source basis7bf6d4f, 2026-10-22. Local-only isolated correction branch; main App/provider integrator owns006 independently.

## Evidence and required result

1. calendarDate.ts currently samples local-date keys hourly. America/St_Johns on2009-11-01 first reaches the date at02:30Z, rolls back toOctober31 at02:31Z, and reaches it again at03:30Z. The current helper returns03:30Z because the brief appearance is between samples. Timeline's15-minute date-key scan misses both early transitions when the rail begins00:05Z. Primary reproduced the helper result and explicit Intl fields; staff also reproduced1988/2010 examples.
2. Timeline updates prevOffsetRef only when view identity changes. At midnight a fixed preview's derived offset falls44→43 without a new view; choosing the next date gives44, which compares against stale44 and animates backward. Preserve no-remount on midnight while using current bookkeeping for the next forward change.

## Proposed technical approach

Within the existing bounded absolute-time window, detect actual offset discontinuities by comparing explicit-zone offset fields across hourly brackets and binary-searching an offset change to its exact instant. Partition into constant-offset spans; do not merely decrease local-date sample frequency. Enumerate calendar-midnight candidates analytically within each constant-offset span using UTC calendar arithmetic, and include an offset-jump span start when the jump itself changes the local date. Round-trip candidate and candidate-1ms through explicit Intl fields, sort/deduplicate, and honor half-open bounds.

Reuse this boundary enumeration for earliest start-of-date over the existing72h window and all timeline date boundaries through the final cell. Preserve first-representable-date behavior, skipped-date rejection, nonzero geometry and fixed25-cell rail. No timezone database/package, browser-local shifted Dates, or hidden date-range narrowing. Keep any assumptions of the bounded offset scan explicit in code/evidence.

Update animation offset bookkeeping even when view identity stays stable, or compare stable previous/current view instants. A pure midnight offset decrement must not remount; a subsequent next-date choice must animate forward. Use meaningful rendered transition assertions, not only a duplicated comparison helper.

## Scope

- src/utils/calendarDate.ts and calendarDate.test.ts
- src/utils/timeline.ts and timeline.test.ts
- src/app/components/Timeline.tsx and Timeline.test.tsx
- plans/date-correction-evidence.md

No App, provider, Settings, package/lockfile or006 callsite changes. Reuse the completed analytics managed worktree on a new local branch based7bf6d4f; retain analytics commits on their existing branch. Preserve the untracked staff review document. Main integrator later cherry-picks only the correction commit.

## Tests and verification

Add St_Johns2009 earliest02:30Z and both02:30/02:31 transitions, including a rail whose00:05Z start defeats the prior scan. Include the later03:30 return, correct labels/coordinates on both sides, and historical1988/2010 fixtures verified via explicit Intl. Keep all current Santiago/Havana/Lord_Howe/NewYork/fractional/browser-DST regressions. Retain public0001/0099 support: the72h bracket for0001 crosses astronomical year0, so internal Intl era/surrogate arithmetic must represent that intermediate year correctly instead of rejecting/misreading it. Add explicit earliest-start tests for0001/0099.

Add a rendered no-remount midnight offset44→43 case followed by a later selected date at44; assert forward direction on the latter actual motion wrapper.

Run focused date/model/rendered tests under Node24 with TZ=UTC and America/Vancouver; Kathmandu helpers; npm run typecheck and lint; git diff --check against7bf6d4f. Do not rerun the complete suite or send analytics. Record exact failures before fix and passing evidence after. Staff re-review is required before008. Commit only scoped files locally; no push/PR/deploy/global changes.

## STOP conditions

Report if offset spans cannot be correctly bounded for supported Intl zones, a boundary is silently discarded, date scope must be narrowed, tests require source outside scope, or two repairs fail the same check. Do not increase sampling density to hide the invariant or weaken earliest-boundary assertions.
