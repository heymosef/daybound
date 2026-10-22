# Plan 004 implementation evidence

Implemented locally after plan007 commit `c4bf6e2`; preserved accepted persistence, fixed-date/control and calendar-opening behavior. No analytics, clock-frequency or performance optimization phase was implemented.

`src/utils/timeline.ts` builds exactly25 cells separated by3600000ms. Live rows share floor(epoch/3600000) as their UTC anchor and use elapsed fractional-hour progress including seconds/milliseconds; date preview starts at the exact supplied earliest representable home-date instant. All row/marker/rail clocks, date keys, weekday/weekend, labels, abbreviation and UTC offsets use explicit-zone Intl fields. Rail labels show nonzero minutes in both formats. The shared calendar formatter cache is bounded to128 entries. Date helper fields also handle AD/BC numbering when checking the previous instant of the earliest validated positive-year dates; two tests cover0001/0099 rather than leaving JavaScript's year0–99 constructor interpretation implicit.

Local-date transitions are bracketed at15-minute intervals throughout [start,start+25h), bisected to the millisecond via the shared explicit-zone date helper, and positioned in fractional cell units. This includes transitions inside the final cell; the right endpoint is excluded. Initial segment labels are separate from actual date-change dividers. The allowed left-edge date-preview divider remains hidden; fractional/interior dividers remain present. Floating label positioning/overlap behavior, visual tokens, motion durations and shared hover indices remain. Cells expose exact instant/UTC offset in their accessible group name and title, disambiguating repeated hours.

Timeline date animations now track live or the actual supplied preview instant rather than a decreasing derived offset; fixed preview does not remount solely because home midnight changes its displayed offset. Marker exit uses AnimatePresence's last mounted children instead of mutating a ref during render. Row format direction uses React's guarded own-component state adjustment instead of ref mutations in render; the existing direction and timing are retained.

## Verification

All commands used locally scoped Node24 via `npm exec --yes --package=node@24 -- sh -c '...'`:

```sh
TZ=UTC npm test -- src/utils/timeline.test.ts src/utils/calendarDate.test.ts src/app/components/Timeline.test.tsx
TZ=America/Vancouver npm test -- src/utils/timeline.test.ts src/utils/calendarDate.test.ts src/app/components/Timeline.test.tsx
TZ=Asia/Kathmandu npm test -- src/utils/timeline.test.ts src/utils/calendarDate.test.ts
npm run typecheck
npm run lint
```

Final results: UTC49 passed; Vancouver49 passed; Kathmandu37 passed; typecheck/lint both0. Counts:21 calendar helper tests,16 timeline model tests,12 rendered Timeline/TimezoneRow tests. After rail integration, `npm test -- src/app/App.test.tsx src/app/components/DatePicker.test.tsx src/app/components/CalendarDropdown.test.tsx` also passed57/57. These are focused layers/matrices;009 still owns the final complete suite and browser checks.

Model and rendered assertions cover exact Kathmandu00:00/18:15Z anchor, Kolkata/Adelaide fractional minutes, a0.25-cell true midnight preceding a00:45 sample (no fake midnight at that sample), final-cell24.5 boundary, half-open endpoint exclusion, initial date label versus divider, New York missing/repeated hour with distinct offsets, Santiago missing midnight/01:00 first time, Havana earliest repeated midnight, both Lord Howe30-minute shifts,25 cells throughout, shared live anchor/progress, actual centered marker and shared hover behavior. With real TimezoneRow/Timeline rendering at2026-03-07T21:00Z, Kolkata row clock is02:30, marker/rail2:30, dateSun Mar8, offsetUTC+05:30 and abbreviationGMT+5:30 in both UTC and Vancouver processes.

Geometry tests set both offsetWidth and scrollWidth to2500px. They assert fractional dividers at1%/25px, final-cell divider98%/2450px, initial segment label0px, shared marker1250px and identical live rail transforms. No zero-width shortcut hides the geometry. One initial rendered test had an ambiguous shared row/rail date-text query; scoping the assertion to the row clock's own date block corrected the selector without changing the expected date.

Primary noted for approved008 profiling: hidden CalendarDropdown currently repeats date-start checks for all month days each tick, and fixed-preview resolution repeats the unchanged start-date search.008 should measure closed/open calendar and fixed-preview date-start/Intl counts before/after memoization or skipping hidden work; correctness here does not depend on those optimizations.

Working/staged/cumulative whitespace checks are required before commit. No remote workflows, live analytics traffic, external writes, browser automation or global runtime changes were performed.
