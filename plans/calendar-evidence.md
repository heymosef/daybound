# Plan 003 implementation evidence

Local branch `codex/daybound-maintenance`, isolated worktree. Expected predecessor changes are plan001's DatePicker mock typing/selector repairs; those remain intact. Primary-owned plan index/EOF cleanup and staff bootstrap review are included in this commit.

Added seven actual CalendarDropdown lifecycle tests using fixed ISO instants and rerendered now props: +1 second/+1 minute, far-future selected month and reopen, intentional selection/home-zone changes, month-crossing midnight, fresh past-day disabling, and close callback methods. Against the predecessor code, `npm test -- src/app/components/DatePicker.test.tsx src/app/components/CalendarDropdown.test.tsx` failed four new tests and passed 27. Failures were tick reset, selected month on open, explicit selection change and midnight reset. This establishes regression evidence rather than relying only on helper assertions.

The component initializes its month from the selection and compares explicit previous open/selection/home-zone context. Changed clock/calendar fields still update day disabling, but do not trigger a browsing reset. Date offset policy, DatePicker API, motion timings/tokens, accessible button names, dismissal callbacks and focus behavior are unchanged.

Final local invocation via npm-exec Node24:

```sh
npm exec --yes --package=node@24 -- sh -c 'npm test -- src/app/components/DatePicker.test.tsx src/app/components/CalendarDropdown.test.tsx && npm run typecheck && npm run lint'
git diff --check
git diff --check b77ff08
```

All exit 0; 31 tests pass (24 existing DatePicker tests plus seven new calendar tests). Existing Escape/date selection/Today behavior remains covered; added outside-click callback coverage passes. Working and cumulative whitespace checks pass. No remote workflow/browser/global runtime changes. Read the React checklist for this phase; no component or interaction redesign was introduced.
