# Offline browser fixtures

These pages mount the real App, styles and AnalyticsProvider. Controls live only
in the generated shell, never in the product. Generate them after integration
so the bundles contain the final source:

```sh
npm exec --yes --package=node@24 --package=npm@11 -- node scripts/browser-fixtures.mjs
python3 -m http.server 4174 --bind 127.0.0.1 --directory node_modules/.cache/daybound-smoke/site
```

Run the server as a separate terminal command. The generator exits after building;
it starts no server. Entries are under `node_modules/.cache/daybound-smoke/entries/`
and output is under `node_modules/.cache/daybound-smoke/site/`. Both are ignored.
No `.env` files are read. Stop the server with Ctrl-C. Use supported CUA tools
for actual browser interactions; this generator does not launch a browser or use
Playwright/CDP.

Use the regular production build separately on port4173:

```sh
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Normal product analytics remains disabled on localhost/127.0.0.1 even if a build
has public configuration. The fixture does not alter that policy.

## Fixture routes

All routes start at `http://127.0.0.1:4174/`:

| Query | Initial clock and purpose |
| --- | --- |
| `?scenario=midnight` | 2026-03-07 23:59:30Z, UTC home; fixed-date/home-midnight lifecycle |
| `?scenario=fractional` | 2026-03-07 21:00Z; Kolkata02:30, Kathmandu02:45 and Adelaide fractional labels |
| `?scenario=dst-spring` | 2026-03-08 06:59:30Z, New York home; missing hour |
| `?scenario=dst-fall` | 2026-11-01 05:59:30Z, New York home; repeated hour and explicit offsets |
| `?scenario=st-johns` | 2009-11-01 02:29:30Z, St Johns home; brief date and backward date crossing |
| `?storage=corrupt` | Malformed timezone/settings JSON before App initialization |
| `?storage=blocked` | localStorage property getter throws SecurityError before initialization |
| `?storage=quota` | Storage writes throw QuotaExceededError before initialization |
| `?systemTheme=dark` (or `light`) | Fixture-only system preference; seeds System mode and enables a simulated preference-change button |
| `?analytics=on` | Injected production fixture context, fake public token and .invalid host |

Combine parameters, for example
[the midnight analytics fixture](http://127.0.0.1:4174/?scenario=midnight&analytics=on).
Scenario, storage mode or analytics mode changes reset this fixture's known
storage keys. Unchanged profiles retain edits and saved opt-out through reload.
Append `&reset=1` to reseed explicitly, then remove it before checking persistence.
Fixture storage is isolated on port4174. Reload resets the clock and starts the
product in live mode; it does not persist selected dates.

Rows seed UTC, Kolkata, Kathmandu, Adelaide, New York and Lord Howe, plus St Johns
in its scenario. Choose fixed dates and home zones using actual product controls.
The fixture never sets product React state directly.

## Controls and observations

- Startup theme output records the root class, design and browser chrome color
  after App initialization and before React mounts. With `systemTheme=dark` or
  `light`, Simulate system theme change dispatches a fixture-only media event;
  explicit Light/Dark product choices should ignore it. OS preferences are untouched.
- Advance minute/day changes `Date`/`Date.now` and dispatches focus/visibility
  events so the real clock hook refreshes. Native timers and Motion remain real.
- Advance minute without focus only changes the clock; Resume focus dispatches
  lifecycle events. Real timers can still fire naturally. Actual hidden-tab
  interaction and resumption belong to the browser verification owner.
- The request status and expandable JSON expose count, complete envelopes,
  request options, pending count and each intercepted AbortSignal cancellation.
  Perform actual product actions to produce requests; there is no capture button.
- Complete pending requests resolves intercepted requests locally. Leave requests
  pending to observe cancellation when opting out in product Settings.
- Simulate other-tab opt-out persists a denial when storage allows, then dispatches
  the same StorageEvent used by the controller. Product Settings owns opt-in.

In analytics mode, the provider gets `production: true`, the fixture hostname,
`phc_offline_fixture_only`, and `https://analytics.daybound.invalid`. Browser
DNT is replaced with false only in this explicit offline fixture so the
transport is deterministic; production still respects browser privacy signals.
Fetch interception is installed before App/provider modules load and never calls
native fetch. Every unexpected fetch rejects. A content-security policy also
blocks all network connections and external fonts/assets. Baseline Google Fonts
imports are blocked; integrated local fonts can load from the same fixture origin.
No live analytics key or host is read or embedded by the generator.

This harness prepares offline verification. It is not evidence of completed
browser smoke, live ingestion, deployment, or remote CI. Record actual desktop/mobile observations with the change being verified.
See [maintenance decisions and verification limits](maintenance-decisions.md).

## BC permanent-time regression

Use `?scenario=bc-fall&reset=1` to start at 2026-11-01T08:59:30Z with
Vancouver, Los Angeles and other recently changed Canadian zones. Advance one
minute: Vancouver shows 02:00 PCT, Los Angeles 01:00 PST. Drag any timeline or
use Shift+ArrowRight to explore 24 hours ahead; advance the clock again to verify
the explored view holds while unselected row clocks advance. Tap a visible slot:
all clocks and their local dates must match that instant, matching columns are
highlighted, and Advance minute must leave those clocks fixed. A subsequent
swipe must move only the view; tapping Today restores live time. Choose another
future date to retain the selected home-city time, and change home city to retain
the same instant while updating its calendar date. While selected, there must be
no time line or time pill. Tap the highlighted column again in either row to
clear it while retaining the surfaced date and scrub position; clocks resume
live time. Enter/Space should toggle the reference slot. Today/Home explicitly
returns the timeline to now.
No live analytics are used.
The offline CSP permits the app's own blob Paint Worklet while all fetches are
intercepted and connect-src remains none. This preserves the product's corner
rendering during visual checks.

Time-selection verification, 2026-10-23: the production preview and offline fixture
were checked at desktop size and 390×844. Future row dates, synchronized slot
selection, fixed clocks after Advance minute, swipe without selection, keyboard
Enter/Home, and Today reset passed. Browser pointer controls were used; a physical
touchscreen and screen-reader speech were not tested. Automated coverage includes
implicit touch-capture transfer, fractional offsets, DST gaps/repeated hours, and
home-city date-line changes. Final checks passed on Node24: typecheck, lint,
396 tests across 23 files, and production/fixture builds.

Follow-up toggle check, 2026-10-23: the refreshed production preview showed no
time marker/pill during selection. Clicking the corresponding highlighted cell
in another city cleared all selected columns and restored live Today. Typecheck,
lint, all 402 tests across 23 files, and the production build passed.

Soft-band check, 2026-10-23: desktop and 390px preview checks confirmed aligned
selection fills without box outlines, rounded band ends, a home-row anchor dot
(each row on mobile), and tap-to-clear. Selected-label contrast measured
4.53:1–8.82:1 across TE-1, Gamut, and DOS in both appearances, using computed sRGB
colors clamped to the display gamut. Typecheck, lint, all 402 tests, and build
passed. Forced-colors styling has a system-color fallback but was not emulated.

Clock-change indicator check, 2026-10-23: only affected rows show a dashed
transition marker with Back/Forward and the exact change amount. The date-boundary
scan supplies offset changes too, without a second scan. Automated coverage
includes spring/fall, Lord Howe half-hour changes, rail endpoints, fractional
positions, selection, panning, and Vancouver's permanent Pacific time. Offline
desktop and 390px checks confirmed Back/Forward labels fit and remain visible
with a selected column, while current-time markers stay hidden. Across TE-1,
Gamut and DOS in both appearances, measured label contrast was 14.30:1–19.68:1;
the lowest observed marker contrast against a selected fill, including theme
transitions, was 7.22:1. Forced-colors fallback is present but was not emulated.
Node24 typecheck, lint, all 410 tests in 23 files, production and offline fixture
builds passed. No live analytics credentials were used.

Selection clearing update, 2026-10-23: deselection clears only the selected
instant, preserving the current rail frame and surfaced calendar date. This
supersedes the earlier tap-to-clear behavior that reset to Today. Regressions
cover both cities, future dates, scrubbing before/after selection, partial-hour
date selections, keyboard toggling, subsequent clock ticks, and explicit Today
reset. City clocks resume live time when no column is selected.
Offline browser verification confirmed a scrubbed future-date frame and calendar
selection survive clearing from another city and Advance minute; Today resets
the frame. Node24 typecheck, lint, all 413 tests, production and fixture builds
passed. The production preview on port4180 has the refreshed build.

Credits modal check, 2026-10-23: Credits is available in the desktop/mobile footer
and removed from Settings. The native modal retains GeoNames, licence, source
and adaptation details. Browser checks confirmed initial close-button focus,
Tab/Shift+Tab wrapping, blocked background app shortcuts, Escape, close-button
and backdrop dismissal, restored trigger focus, and background scroll locking.
The 320px dark appearance fits without horizontal overflow; desktop light was
also checked. Attribution links open separately to retain the current app view.
The original System appearance was restored after verification. Node24 typecheck,
lint, all 418 tests across 24 files, and the production build passed.

Credits placement update, 2026-10-23: City data credits now opens from Settings,
with the same text as the modal heading; the footer link is removed. Desktop
and 320px browser checks confirmed the modal fits, focus wraps, and closing
returns focus to the credits menu item while keeping Settings open. Typecheck,
lint, all 418 tests, and the production build passed.

Credits refinement, 2026-10-23: the modal now has one heading, City data credits.
Selecting its compact Settings entry closes the dropdown; the modal is mounted
separately so it survives the dropdown exit. Closing returns focus to Settings
without reopening the menu. Desktop verification measured the entry section at
38px (25px button); coarse-pointer styling retains a 44px touch target. Desktop
and 320px browser checks passed for dismissal, focus wrapping and modal fit.
Typecheck, lint, all 418 tests, and the production build passed.
