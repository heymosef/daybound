# Plan 008 performance evidence

## Candidate and method

Measured 2026-10-22 on locally scoped Node v24.22.1. Before is `74ea93a` (including the approved brief-date correction); after is the plan008 working tree committed with this record. The earlier plan006 build of 396590 raw JS bytes predates that correction and is not the immediate baseline here. No application environment file or live analytics configuration was used.

A disposable Vite pre-transform in ignored `node_modules/.cache/daybound-profile` counted actual component function entries, date-start searches, search-loop passes, and the explicit Intl `formatToParts` call site while rendering the real App. React Profiler counted commits. Tests seeded 1/10/25 unique valid rows at a fixed March 2, 2026 noon instant, warmed an unmatched search, reset counters after mount/action preparation, then performed each scenario. A minute means 60 separate `act` advances of one second, so the former one-second clock was not hidden by React batching. Open-calendar and fixed-preview scenarios were prepared before counter reset. Hover used an actual timeline cell; settings used actual menu controls. No timers, formatters, or production component logic were stubbed for these counts. The harness ran all three row sizes successfully both before and after (profiling-only 60-second test timeout); it is deliberately ignored instrumentation, not a permanent performance framework. No wall-time, CPU, battery or browser performance claim follows from these counts.

The cache retains one rail model per mounted row, one selected-date start per current date/zone, and one viewed month while open. No global unbounded cache or custom memo comparator was introduced. Closed calendars skip date-start work. Minute-aligned updates use actual wall time after focus/pageshow/visibility restoration.

## Measured work

Each cell is before → after. Intl is the number of explicit field conversions, not formatter allocations. Row/rail counts are function entries, not DOM mutation counts.

| Rows | Scenario | Row renders | Rail renders | Date-start searches | Search scans | Intl field conversions | React commits |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | closed-minute | 60 → 1 | 60 → 1 | 2280 → 0 | 60 → 0 | 197880 → 5 | 60 → 1 |
| 1 | closed-hover | 1 → 1 | 1 → 1 | 38 → 0 | 1 → 0 | 3298 → 1 | 1 → 1 |
| 1 | open-minute | 60 → 1 | 60 → 1 | 2311 → 0 | 60 → 0 | 200516 → 6 | 61 → 2 |
| 1 | fixed-minute | 60 → 1 | 60 → 0 | 2340 → 0 | 60 → 0 | 202980 → 4 | 60 → 1 |
| 1 | format-change | 3 → 2 | 3 → 2 | 78 → 0 | 2 → 0 | 6831 → 3 | 3 → 3 |
| 1 | theme-change | 2 → 0 | 2 → 0 | 78 → 0 | 2 → 0 | 6766 → 2 | 2 → 2 |
| 10 | closed-minute | 600 → 10 | 600 → 10 | 2280 → 0 | 60 → 0 | 231060 → 23 | 60 → 1 |
| 10 | closed-hover | 10 → 10 | 10 → 10 | 38 → 0 | 1 → 0 | 3851 → 1 | 1 → 1 |
| 10 | open-minute | 600 → 10 | 600 → 10 | 2311 → 0 | 60 → 0 | 233696 → 24 | 61 → 2 |
| 10 | fixed-minute | 600 → 10 | 600 → 0 | 2340 → 0 | 60 → 0 | 236160 → 13 | 60 → 1 |
| 10 | format-change | 30 → 20 | 30 → 20 | 78 → 0 | 2 → 0 | 8490 → 12 | 3 → 3 |
| 10 | theme-change | 20 → 0 | 20 → 0 | 78 → 0 | 2 → 0 | 7872 → 2 | 2 → 2 |
| 25 | closed-minute | 1500 → 25 | 1500 → 25 | 2280 → 0 | 60 → 0 | 285960 → 53 | 60 → 1 |
| 25 | closed-hover | 25 → 25 | 25 → 25 | 38 → 0 | 1 → 0 | 4766 → 1 | 1 → 1 |
| 25 | open-minute | 1500 → 25 | 1500 → 25 | 2311 → 0 | 60 → 0 | 288596 → 54 | 61 → 2 |
| 25 | fixed-minute | 1500 → 25 | 1500 → 0 | 2340 → 0 | 60 → 0 | 291060 → 28 | 60 → 1 |
| 25 | format-change | 75 → 50 | 75 → 50 | 78 → 0 | 2 → 0 | 11235 → 27 | 3 → 3 |
| 25 | theme-change | 50 → 0 | 50 → 0 | 78 → 0 | 2 → 0 | 9702 → 2 | 2 → 2 |

## Bundle and font decisions

Reproducible current metrics: `npm exec --yes --package=node@24 -- node scripts/measure-bundle.mjs`. Vite output is held in memory and gzip measured with node:zlib; this command does not replace the final disk build.

| Candidate | JS bytes | JS gzip | CSS bytes | CSS gzip |
| --- | ---: | ---: | ---: | ---: |
| Before008, corrected date baseline | 396931 | 126151 | 48992 | 10004 |
| After008 | 397865 | 126453 | 48880 | 10002 |
| In-memory LazyMotion/domMax experiment | 398271 | 127139 | 48880 | 10002 |

The memo/clock changes add 934 raw /302 gzip JS bytes to the immediate baseline while removing measured repeated work. `node scripts/measure-bundle.mjs --experiment-lazy-motion` substitutes m and wraps the application with LazyMotion/domMax only in memory; domMax preserves layout/reorder features. Its additional 406 raw /686 gzip JS bytes over the implemented candidate provide no bundle benefit, so the Motion change was rejected. Production motion code remains intact. Deferred SDK loading is superseded by006 SDK removal. Compared with the original audit (592949 raw /188408 gzip JS), this candidate is 195084 raw /61955 gzip bytes smaller; that comparison includes dependency, SDK and other maintenance changes, so it does not isolate SDK removal causally.

Three Google Fonts stylesheet imports are consolidated into one CSS2 request preserving Inter100–900, Geist Mono100–900, Pixelify Sans400–700 and display=swap; connection hints cover fonts.googleapis.com and cross-origin fonts.gstatic.com. No font files were downloaded. The primary reviewer observed three actual pre008 CSS resources in CUA. Final production font-resource inspection is pending the primary browser owner; no font loading-time improvement is claimed. Fixture CSP intentionally blocks remote fonts.

## Verification

- Focused Node24 command: `npm test -- src/hooks/useTime.test.tsx src/app/components/Timeline.test.tsx src/app/components/AddTimezone.test.tsx src/app/App.test.tsx src/utils/timeline.test.ts src/utils/calendarDate.test.ts src/app/components/DatePicker.test.tsx src/app/components/CalendarDropdown.test.tsx` →8 files,130 tests pass. Includes six clock cases, real App fixed-preview/open-calendar caching, and rendered hover/minute conversion regressions.
- `npm run typecheck && npm run lint` →0.
- UTC and America/Vancouver matrices each run calendarDate/timeline/rendered Timeline →59 pass; Asia/Kathmandu calendarDate/timeline helpers →44 pass. Existing skipped/repeated midnight, short-lived date, fractional-zone, DST and animation-direction regressions retained.
- `git diff --check` and cumulative `git diff --check b77ff08` →0 before commit.
- Final complete suite, clean install, disk build/audit and actual browser checks are owned by009 after cleanup integration. No remote workflow, deployment or live ingestion was run.
