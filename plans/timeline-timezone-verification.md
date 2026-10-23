# Timeline exploration, fitted calendar, and current timezone data

## Accepted behavior

All timelines move together while city clocks stay live. Exploration reaches
24 elapsed hours ahead, holds its absolute view while real time advances, and
resets with Return to now/Today, date selection or home-city changes. Horizontal
pointer/touch dragging, horizontal wheels, keyboard arrows/Shift+arrows and
Page Up/Down are supported. Vertical page scrolling, pinch zoom and Home reset
remain available. The comparison frame still renders 25 elapsed-hour cells,
reanchored as the view moves; it is not expanded into an unbounded timeline.

The calendar remains a popup. It is portalled and fixed to the visible viewport,
clamped horizontally, placed above when appropriate, and scrollable within short
viewports. Its grid shrinks to fit, focus enters on opening/reopening, Escape and
selection restore trigger focus, and exiting content is inert.

Timezone rules are bundled from IANA 2026e through pinned @js-joda/core 6.3.0 and
@js-joda/timezone 3.1.0. Names/aliases are generated from development-only
tzdata 1.0.52. Local stored IDs/labels remain intact. Browser timezone data no
longer determines offsets, valid zones or calendar boundaries. BC's official
PCT naming is a separately sourced display rule, not a fixed-offset replacement
for IANA history or all BC zones. See docs/timezone-data.md for scope and updates.

## Verification

Final release candidate: Node 24/npm 11, both TypeScript projects PASS, ESLint
zero warnings, 21 test files / 368 tests PASS, production build and offline
fixture build PASS. npm audit found 0 vulnerabilities, dependency graph is valid,
IANA current-version check reports bundled 2026e/current 2026e, and all three
existing SQL report logic checks PASS. Final UI corrections were rechecked:
focus outline sits inside the clipped rail, calendar focus survives reopening
after another month, and timeline cells reuse directional fade hints.

New regression coverage includes BC's non-fallback vs Los Angeles, PCT naming
and backwards aliases, separate mountain-time BC zones, Edmonton/Winnipeg/Inuvik
updates, historical seconds, Samoa's skipped day, simulated unavailable device
Intl timezone data, popup geometry on narrow/short screens, pointer intent and
cleanup, queued-wheel cancellation on Home, synchronized+24h exploration,
clock advancement without moving the explored view, and reset behavior.

Actual browser checks on the real App via the offline fixture (fake clock,
no live analytics; request count remains 0):

- At 320px width, dragging one row by 190px advanced all 10 rows from
  2026-11-01T08:59:30Z to 2026-11-01T12:38:43.846Z together. Vertical wheels still
  scroll the page. The exploration control reserves space to avoid drag-time
  layout shifts.
- Four Shift+Right actions reached the +24h bound, with every row showing the
  same 2026-11-02T08:59:30Z view.
- Advance minute kept that view fixed while live clock instants changed to
  2026-11-01T09:00:30Z. Final displayed clocks: Vancouver 02:00 PCT,
  Los Angeles 01:00 PST, Edmonton 03:00, Winnipeg 04:00.
- At 320×700, popup bounds were left8/right296/top348/bottom692. Short-screen
  checks used an effective 291×227 zoomed viewport: popup stayed within its
  margins and internally scrolled 120.9px to reach Today. Extra-narrow effective
  218px width had no popup horizontal overflow and date cells about 26.3px wide.
- Selecting November 2 reset exploration to the selected Vancouver midnight,
  2026-11-02T07:00Z, and returned focus to Open calendar. Today restored the live
  instant. Wide viewport navigation and Escape worked; reopening after browsing
  another month keeps focus inside the dialog.
- Native keyboard focus has an inset visible outline. The cells' mask fades
  remaining edges; the marker/date overlays and outline remain outside that
  mask. Computed touch-action permits pan-y and pinch-zoom. Browser console
  errors: none. Temporary viewport override reset.

The offline fixture now permits its own blob Paint Worklet so rounded frames
render during visual tests; connect-src remains none and fetch stays fully
intercepted. It includes a bc-fall scenario for repeatable boundary checks.
Physical iOS/Android hardware was not tested; pointer intent has automated tests
and real mouse/trackpad/keyboard paths were verified in the in-app browser.

The full rules increase initial JavaScript from roughly 131.49kB to 218.33kB gzip
(about 87kB). The large-chunk build warning is expected from the highly compressible
full dataset. This is the explicit user-approved rules/download tradeoff; future
laws still need reviewed data updates and a release. No runtime timezone API,
new analytics events or background monitoring is introduced.

All work remains local. The original checkout receives the verified commit by
fast-forward; dependencies are restored with scoped Node 24/npm 11 npm ci and its
existing 127.0.0.1:4173 preview rebuilt. No push, PR, deployment, external dashboard
change, or global runtime/model configuration change.

Sources: https://www.iana.org/time-zones
https://data.iana.org/time-zones/tzdb/NEWS
https://news.gov.bc.ca/releases/2026CITZ0009-001073
