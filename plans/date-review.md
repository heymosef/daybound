# Date correctness staff review

**Verdict: REVISE before plan 008 optimizes these paths.** Reviewed commits `c4bf6e2` and `7bf6d4f` against `94ec757`. Two bounded corrections below are required. The proposed correction architecture has been approved; its implementation still needs re-review.

Reviewer: GPT-6 Astra, High reasoning effort. Date: October 22, 2026. Reviewed the calendar/timeline helpers, App and control integration, TimezoneRow/Timeline rendering, focused tests and both evidence documents. No full suite was rerun. Two small read-only probes exercised the actual helper/rail code without live network or source edits.

## Required corrections

### [TIME-03] Find short-lived local dates across offset discontinuities

- **Evidence:** `src/utils/calendarDate.ts` scans hourly endpoints and bisects only when their local date keys differ. `src/utils/timeline.ts` uses the same assumption at quarter-hour intervals. In `America/St_Johns`, `startOfCalendarDate('2009-11-01', ...)` returns `2009-11-01T03:30:00Z`, although the date first starts at `02:30Z`, returns to October 31 at `02:31Z`, then starts again at `03:30Z`. Equivalent earliest-start failures reproduce for 1988-10-30 and 2010-11-07. A rail beginning `2009-11-01T00:05:00Z` misses both the 02:30 and 02:31 date changes; a rail beginning 00:00 happens to find them because a sample lands on the short interval.
- **Impact:** Endpoint equality does not prove there was no date change within a bracket. The advertised earliest-date/repeated-date helper can choose a later start, and fractional rail boundaries depend on sample alignment. Current future-only UI selection limits direct exposure to these historical fixtures, but this is a concrete false invariant in the shared algorithm and its claimed date-domain support.
- **Effort:** S–M for a shared transition primitive and focused regressions.
- **Risk:** MED; preserve exact millisecond boundaries, skipped dates, early-year behavior and half-open rail endpoints.
- **Confidence:** HIGH; reproduced through the actual helper and actual bundled rail model.
- **Approved fix sketch:** Use the bounded absolute scan to discover actual UTC-offset discontinuities, bisect them, and partition constant-offset spans. Within each span enumerate candidate calendar midnights using UTC calendar arithmetic and the observed offset. Include discontinuity instants where a jump itself changes local date; validate candidates immediately before/at the instant, sort/deduplicate and filter to the half-open bounds. Select the earliest matching target-date boundary. This uses observed offsets rather than guessed ones. Do not merely increase blind date-sampling frequency.
- **Required proof:** St_Johns 2009 earliest 02:30Z, rollback 02:31Z, subsequent 03:30Z; a rail starting 00:05Z must contain all three boundaries. Include the 1988 double rollback if practical. Retain Santiago/Havana/Lord Howe, Apia, fractional offsets, final-cell/right-endpoint and 0001/0099 regressions. The search bracket for year 0001 includes astronomical year zero; internal arithmetic must handle that intermediate value.

### [UX-01] Keep animation direction bookkeeping current without remounting fixed dates

- **Evidence:** `src/app/components/Timeline.tsx` updates `prevOffsetRef` only when `viewIdentity` changes. Home midnight decreases the derived offset while the same fixed date/instant intentionally keeps `viewIdentity` unchanged.
- **Impact:** After offset 44 becomes 43 at midnight, choosing the next date produces offset 44. Comparing it with stale 44 selects the backward animation direction even though the user moved forward.
- **Effort:** S, including a focused render regression.
- **Risk:** LOW; preserve the desired absence of remounts on offset-only ticking.
- **Confidence:** HIGH from the state/ref update sequence.
- **Approved fix sketch:** Keep previous-offset bookkeeping current independently of whether the view changed, or derive direction from stable date/instant identities. Test that the fixed-view motion wrapper survives the midnight offset change and that the subsequent later-date selection animates forward.

## Other reviewed behavior

Explicit-zone Gregorian/Latin Intl fields avoid the reproduced synthetic browser-DST error throughout row clocks, marker, labels, calendar fields and abbreviation/offset display. UTC surrogate calendar arithmetic correctly separates calendar days from elapsed zoned-day durations. The selected-date union is transient; actual App tests cover home midnight, date-line home changes, equal-today preview, past fallback, explicit Today and reload. Controls preserve calendar browsing by stable date identity and explain disabled skipped dates.

The rail retains 25 consecutive elapsed-hour cells, a shared UTC live anchor and fractional progress. Its rendering distinguishes initial date segments from actual dividers, searches the final cell, excludes the right endpoint and provides exact repeated-hour instants/offsets through accessible names. Nonzero-width rendering tests exercise fractional coordinates, shared hover and centered markers rather than only helper output. Actual browser layout/animation verification remains required by plan 009.

The recorded timezone matrices and App/control checks were inspected, not duplicated. They establish meaningful existing coverage but miss the two sequences above. Repeated date-start/Intl work in closed calendars and fixed previews is a legitimate plan 008 optimization target after correctness is repaired. No export/import or working-hours feature implementation is authorized by this review.

The primary may continue independent analytics integration. Re-review the date correction commit before optimizing these helpers/render paths or marking plans 004/007 reviewed complete.
