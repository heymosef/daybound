# Maintenance decisions

Daybound is a static, device-local timezone comparison app. The nine original
maintenance findings are implemented. Portable configuration and working-hours
overlap remain [deferred designs](../plans/README.md).

## Behavior to preserve

- Choosing a future date sets the clocks to the current home-city time of day
  on that date; choosing another date preserves the selected home-city time.
  A selected instant stays fixed across midnight and home-city changes; each
  city's clock/date and the home calendar use its converted local fields.
  Explicit Today (even when already selected) and reload restore live clocks.
- Timelines share exact instants and 25 elapsed-hour cells; fractional offsets,
  DST gaps/repeats and date boundaries remain precise. Missing midnight uses the
  first existing instant, repeated midnight its earliest occurrence, and wholly
  skipped dates are unavailable.
- Scrubbing moves every timeline together and freezes the explored instant without
  changing the clocks. Tapping a column selects its exact instant across all cities
  and highlights the corresponding cells; Enter/Space selects the reference slot.
  Tapping a selected cell again (in any row) clears the selection and restores
  live Today. Enter/Space also toggles the reference slot. The time line and pill
  are hidden during selection; the selected column remains highlighted.
  Both modes allow 24 hours backward/forward from their
  starting point. The top date controls follow the home-city date at the center
  in Today mode or the leading edge for a selected date; tapping a slot uses its
  home-city date. Today and date selection reset the pan. A home-city change
  resets unselected browsing and preserves a selected instant. Vertical scrolling, pinch zoom, keyboard
  navigation and reduced-motion preferences remain available.
- The calendar popup fits the visible viewport, supports short-screen scrolling,
  restores keyboard focus and keeps exiting content inert.
- Valid saved rows/settings survive partial recovery. Blocked or full storage
  preserves in-memory operation and reports that saving is unavailable. Do not
  replace unread saved data with fallback defaults or recreate a default city
  after the user removes the final row.
- Date-start/model caching and minute-aligned clock refresh preserve correctness
  through hover, home changes, midnight, backgrounding and resume. Do not replace
  cached date-start resolution with a new boundary scan on every clock update.

Timezone sources, the chosen full-data download tradeoff, BC's PCT display rule
and the repeatable update process are in [timezone data](timezone-data.md).
Search sampling/retention, catalogue scope and report templates are in
[search analytics](search-analytics.md). Explicit settings/reference-city events
are in [usage analytics](usage-analytics.md). Preserve their opt-out, cancellation,
runtime projection and filtering boundaries. No automatic capture, replay,
persistent person identity, URL/referrer reporting, retry or unload delivery is
introduced. Sampled failed words use normal PostHog retention, as chosen by the
user; there is no seven-day deletion rule.

## Verification and historical context

Use Node24, `npm ci`, typecheck, lint, tests and build as described in the README.
Use [offline browser fixtures](browser-testing.md) for isolated product checks;
never use live analytics credentials. Keep timer, storage and mock teardown local
to each test suite. Test expected dates independently from production formatters.

Offline interception does not prove live PostHog ingestion/CORS or live HogQL
execution. Local builds do not prove remote CI/deployment. Narrow/short viewport
checks do not replace physical iOS/Android hardware tests. Historical physical
mobile testing and live ingestion were not performed. Changes remain local;
pushing, deployment and external dashboard edits need separate authorization.

The complete pre-cleanup audit/plans/review/browser-evidence snapshot is available
at Git commit `6996580a91dc8582771ac091526eeb407a168f1a`. Its milestone counts and
checkout statements describe their historical candidates, not current status.
A LazyMotion/domMax bundle experiment was rejected because it showed no size gain;
normal bundle measurement remains available in `scripts/measure-bundle.mjs`.
Theme application is shared between synchronous startup and one system-theme
listener. The product-owned city catalogue supplies picker entries and stable
analytics identities. Preserve platform theme/color fallbacks, direct-result
versus alias-metadata precedence, and distinct picker matching versus analytics
recognition when changing these modules.
