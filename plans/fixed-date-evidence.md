# Plan 007 implementation evidence

Implemented in the isolated local branch after accepted003/005. Expected predecessor changes (calendar opening context, persistence hook/status and notices, static fixes) were preserved. Primary's plan index and standalone006 scope clarification are included as plan-only changes; no analytics implementation is in this commit.

Calendar selection is a transient live/date union, with validated YYYY-MM-DD identity. Home changes reinterpret the same calendar date in the new home zone, rather than retaining an absolute instant or recomputing a relative date. Explicit Today returns live; equal-homeToday stays preview; a past selection derives live immediately before rendering and is then cleared. Reload initializes live. Offset values remain derived only for presentation, animation and existing telemetry.

The shared calendar helper extracts Gregorian/Latin calendar fields through bounded cached Intl formatters with explicit timeZone/hourCycle:h23. Day/month/grid arithmetic uses UTC calendar surrogates, never synthetic shifted browser-local Dates or elapsed zoned-day differences. Date-start resolution scans a bounded 72-hour bracket in hourly steps, bisects the first local-date transition to the millisecond, and verifies both the date round trip and previous millisecond. Missing midnight resolves to the first existing local time; repeated midnight picks the first occurrence; an entirely skipped day returns null. Controls disable skipped dates with an explanatory title/status rather than selecting a different day.

Calendar003's opening guard now compares stable date identity (or live), not a decreasing offset. The new regression advances a fixed selection across home midnight while browsing a later month. Existing control names, theme/motion values, dismissal callbacks and successful/failing persistence notice behavior remain.

Verification (locally scoped npm-exec Node24):

- `npm test -- src/utils/calendarDate.test.ts`: 19 passed.
- `TZ=UTC npm test -- src/utils/calendarDate.test.ts`, `TZ=America/Vancouver ...`, `TZ=Asia/Kathmandu ...`: 19 passed in each process timezone, fixed epochs unchanged.
- `npm test -- src/app/App.test.tsx src/app/components/DatePicker.test.tsx src/app/components/CalendarDropdown.test.tsx`: 57 passed (22 App,26 DatePicker,9 CalendarDropdown).
- `npm run typecheck && npm run lint`: both exit0.
- Working and cumulative `git diff --check b77ff08`: exit0.

Fixtures include Santiago2026-09-06 (04:00Z, local01:00), Havana2026-11-01 earliest midnight04:00Z, both Lord Howe transitions, New York, Kathmandu and date-line zones; each resolved start is checked at the previous millisecond and sampled throughout the preceding36h. Apia2011-12-30 is rejected. Kolkata2026-03-07T21:00Z fields are02:30 under all process zones.

Actual App tests select a far-future calendar date, advance the fake clock, switch home west/east across the date line, verify the exact preview instant supplied to every real Timeline, retain equal-today preview, fall back once past, explicitly select Today, and reload live. Timeline data attributes expose its actual supplied mode/instant for these integration assertions; plan004 subsequently verifies the rendered rail consumes the exact instant.

Harness correction: userEvent with fake timers timed out; the fake-clock App cases use Testing Library fireEvent for UI actions, while existing real-timer userEvent/focus tests remain. The first correction exposed ambiguous search/home combobox and animation-exit indicator queries; scoping home queries to the settings menu and keeping indicator assertions in the existing animation-stubbed control tests resolved these harness failures. No product assertion or date expectation was relaxed. Final checks above pass. Full integrated suite/browser proof remain009's responsibility; no remote actions or analytics requests were performed.
