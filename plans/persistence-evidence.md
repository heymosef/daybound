# Plan 005 implementation evidence

Implemented locally in the isolated `codex/daybound-maintenance` worktree after accepted 001/002/003. Compared the scoped predecessor diff: only accepted App cast removal and timezoneUtils unused-import cleanup existed; those remain intact. No plan006/007/date/analytics feature work was included.

## Schema and recovery rules

`src/utils/persistence.ts` defines explicit parsers for the three existing keys. Settings merge valid individual booleans/enums with the same current defaults, preserving partial legacy values. Timezone rows require a nonempty/non-whitespace ID and an identifier accepted by explicit-zone Intl (including UTC/backward aliases; numeric offset identifiers are rejected). Invalid rows are dropped; the first valid occurrence of a duplicate ID or identical timezone string wins. Distinct identifier strings remain separate: aliases are not canonicalized or collapsed. Valid record order, IDs and custom label/city/country strings remain unchanged. Optional text must be a string of at most 1024 UTF-16 code units; an invalid/oversized optional field is omitted without losing its otherwise valid row. Unknown fields are omitted. The first explicit boolean home wins; absent a home, the first valid row becomes home. Recovery never reorders rows or generates replacement IDs. Notice dismissal accepts only boolean true.

The shared reader catches the localStorage property getter/getItem and JSON/parser failures; it has no writes or removals. App's synchronous theme initialization uses this same validated settings reader. No saved values, error objects or private text are logged.

The hook keeps the existing third tuple slot (`loading=false`), adds explicit fourth status (`saved`/`unavailable`), and now takes the parser as a third argument. Functional updates are pure. A committed effect persists normalized recovery values or edits; StrictMode's repeated effect setup does not repeat a given recovery write. No removeItem is needed: corrupt values are replaced by a guarded normalized write, and unrelated keys are never cleared.

If a key's initial getter/read fails, that key stays memory-only for the visit. This avoids overwriting unread valid saved data with fallback defaults (including App's automatic local-zone initialization). Other keys continue independently. If reading succeeded but a write/quota failure occurs, the committed memory value remains usable; a later successful edit/write restores saved status. A reload can retry a blocked initial read. This is a conservative preservation rule, not a guarantee of browser durability.

App combines all three statuses. A stable `role=status` region shows “Changes work for this visit, but cannot be saved on this device.” while any key is unavailable, even after success-notice dismissal. The ongoing failure cannot be dismissed into a false success claim. Existing successful copy, dismissal button/name, focus styling and tab flow are retained. The dismissed empty region uses sr-only so it does not create an extra flex-layout gap.

## Verification

Initial focused parser/hook checks: 40 tests passed. The first App integration run found one failure (56 passed/1 failed): automatic default-zone persistence cleared an initial read-failure status. Adding the memory-only-per-key guard fixed the underlying preservation problem; a hook regression also verifies functional edits never overwrite unread saved data.

Final command:

```sh
npm exec --yes --package=node@24 -- sh -c 'npm test -- src/app/App.test.tsx src/hooks/useStorage.test.tsx src/utils/persistence.test.ts && npm run typecheck && npm run lint'
git diff --check
git diff --check b77ff08
```

All exited 0: 58 tests passed across three files (30 parser, 10 hook, 18 App). Coverage includes null/scalar/array shapes, malformed JSON, partial legacy settings, invalid zones, UTC/aliases, duplicate IDs, home normalization, optional fields, getter/getItem failures, throwing removeItem (unused), setItem/quota failures, memory edits, recovery, stable functional setters, StrictMode write counts, actual App startup with corrupt settings/rows, preserved custom records, independent per-key reads, simultaneous all-key read failure with no overwrite during default-home initialization or memory edits, dismissed-success/later-failure, failed dismissal writes, and synchronous validated theme initialization. All five existing App notice/focus tests pass unchanged.

Applied accessibility/writing guidance to the notice: plain consequence and visit-only limit, persistent polite status region, preserved named dismiss control/focus styling in the successful case. Applied the React checklist to the changed TSX: no new production effect dependencies suppressions, side effects in functional state updates, date-selection behavior or unrelated rendering refactors. Real screen-reader announcements and browser/mobile layout remain plan009's validation responsibility; no browser or remote action was run here. Full final suite is owned by plan009, not repeated in this phase.

Reviewer follow-up: primary requested exact timezone-string deduplication to match App's add policy, retaining the first valid row and its label/order without canonicalizing distinct aliases. The parser regression now covers both duplicate IDs and exact zones; an additional actual-App test seeds an unread valid dashboard, denies every getItem call, exercises a settings edit, and verifies no writes and all original bytes retained. The focused command was rerun for these changes: 58 tests plus both static checks passed.
