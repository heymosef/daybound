# Final independent source review

**Verdict: APPROVE the combined source candidate `80d6be45d6f0e7c7cf96fc1b263982148f3111e8`.** No blocking findings remain from independent source review of the maintenance changes against `b77ff08`. This is source approval, not a claim that final browser/installation checks have completed.

Reviewer: GPT-6 Astra, High reasoning effort. Date: October 22, 2026. Scope: cumulative changed-file/commit review, previously reviewed bootstrap/date/analytics/cleanup changes, and fresh risk-focused inspection of plan 008 and its interactions with the integrated App. Source was not edited. Only this review artifact was written; no complete suite, browser automation, live analytics, external service or deployment work was duplicated.

## Performance and behavior integration

The App's cached selected-date start is keyed by the selected calendar key and home timezone. Current home date, past-date fallback and relative offset are recomputed from the current clock. For valid product selections this preserves the accepted resolver semantics: live remains live; a fixed date remains fixed across home midnight; equal-today remains preview; a past or wholly unavailable date returns live. Home-zone changes recompute the earliest instant. Explicit Today and reload retain their accepted behavior. The selected state is still transient, and fixed-preview identity does not depend on the changing relative offset.

DatePicker caches seven calendar-day results by home date/zone. CalendarDropdown skips closed-month date searches and caches open-month availability by month/zone; current-day/past styling still derives from the fresh clock. Its browsing-context effect retains the accepted open/selection/home-zone reset behavior. Memoization does not suppress a needed date or timezone invalidation.

Timeline retains one model per mounted row keyed by absolute hour/fixed anchor, timezone and live mode. Absolute instants, local fields, fractional boundaries and accessibility descriptions are independent of display format, hover and weekend decoration. The render separately derives actual minute progress, clock formatting and decorations, so caching preserves the shared 25-cell elapsed-time frame, current marker position, repeated-hour identification and exact date dividers. Fixed views still use their exact selected instant. The earlier previous-offset correction remains intact for forward/backward animation after midnight.

The clock starts from the real instant, schedules the next absolute minute, samples wall time rather than incrementing stale state, and refreshes on focus, pageshow and restored visibility. Hidden transitions clear work; unmount and StrictMode cleanup remove timers/listeners. The six focused hook tests cover near-boundary timing, delayed callbacks, hidden/resume behavior and cleanup. Existing date-lifecycle tests remain, and new App/rail tests exercise conversion reuse through actual hover, minute and open-calendar interactions.

Callbacks use current dependencies; functional add/remove/rename updates preserve committed state, and analytics calls stay outside replayable state updaters. Search membership caches follow the timezone list. No custom stale-prop comparator or unbounded model cache was added. The measured 1/10/25-row work reductions are presented as conversion/render counts, without unsupported CPU or battery claims. The documented LazyMotion experiment was rejected after no bundle gain. Font consolidation preserves the three families, weight ranges and swap behavior; actual font loading remains browser-owned evidence.

## Accepted maintenance boundaries

Earlier bootstrap, date-correction, analytics transport/integration and cleanup reviews remain applicable. Risk-focused cumulative inspection confirms those accepted changes were preserved: supported Node24 verification scripts/workflows; recovery parsers and effect-only persistence with truthful failure status; exact explicit-zone date/rail helpers; stable analytics controller and denial latch; runtime event projection and no SDK; offline fixture isolation and local-only operation documentation. No optional portable-configuration or working-hours implementation was introduced.

TIME-03 and UX-01 are closed by integrated `74ea93a` (reviewed source `6069064`). Calendar transition discovery retains its explicitly documented at-most-one-offset-discontinuity-per-hour assumption for the supported IANA/Intl domain, without assuming calendar dates are monotonic or last an hour. The earlier analytics failed-write/restart defect remains closed by the stable controller lifetime and visit-denial latch.

## Validation ownership and remaining evidence

Inspected plan 008 evidence records 130 focused tests, passing typecheck/lint, UTC/Vancouver/Kathmandu date matrices, measured bundle/work counts and whitespace checks. Prior bounded reviews cover their implementers' corresponding evidence. This reviewer also checked cumulative whitespace for `b77ff08..80d6be4`; it passes. No complete suite was rerun by this reviewer.

At this review's issuance, the primary validation layer owns the clean supported-runtime install, complete final suite, production build/audit/dependency checks, rebuilt fixture output and desktop/mobile CUA observations for this exact source candidate. Those results must be recorded before the maintenance task is declared fully complete. Offline interception does not prove external ingestion/CORS, and local workflow inspection does not claim a remote CI run or deployment. Documentation-only evidence/status commits may follow this source hash; any subsequent product-source change requires review of that delta.

## Browser-discovered layout correction: source approval updated

**APPROVE updated source candidate `446ca3ad5c9345c921d4db28dd942fac566d0315`.** This exact-delta approval extends the preceding source review of `80d6be4`; intervening `8406860` contains evidence/documentation. Inspected the cumulative source delta, two new rendered cases, correction evidence and the primary's browser observations. No new blocker remains in source; the final rebuilt label-bounds observation remains primary-owned acceptance evidence.

The desktop screenshot demonstrated adjacent five-character Kathmandu labels colliding under the 1.75em desktop minimum. Removing that responsive override retains the existing 3.25em floor uniformly across every row and both formats. With the current inherited 16–18px font size, the floor is 52–58.5px while hour-label text is capped at 16.25px. The policy therefore gives fractional labels room without varying width by timezone or label content. Narrower visible-hour coverage is the existing clipped-rail behavior; the 25 elapsed cells, absolute instants, marker/hover calculations, fractional boundaries and shared-row alignment model are unchanged.

The two rendered cases preserve 25 cells and matching absolute instant arrays across UTC/Kolkata/Kathmandu in both formats, and assert the shared minimum. They explicitly avoid claiming measured text layout from jsdom. Recorded focused verification passes 36 Timeline/model tests, typecheck, lint, rebuilt production/fixture output and whitespace checks. The prior complete 257-test result applies to the predecessor source; repeating that suite is unnecessary for this single style-policy change with focused checks and actual browser bounds verification. No production JavaScript behavior, dependency, persistence, analytics or date algorithm changed.

The primary's browser record now supplies actual calendar/midnight/home-zone, equal-today/past fallback, fractional/DST/St_Johns, storage recovery and intercepted opt-out observations, plus mobile containment and control operation. These observations supplement the source review; they do not establish live ingestion, external CI or deployment. The final spacing recheck must use freshly rebuilt assets and confirm five-character labels do not overlap while cross-row instant positions remain aligned, including the DOS/Kathmandu 24-hour presentation that exposed the defect.

## Primary acceptance closure

After the exact-delta approval, primary CUA checks on freshly rebuilt446ca3a
passed:1280px quarter-hour label gaps TE-1=13.55px,DOS=19.59px,Gamut=16.55px;
shared cell widths58.5px and cross-row instant positions identical.12h also
passed.390px mobile cells52px,alignment delta0 and page width390px passed.
See browser-evidence.md and corrected screenshots. This closes the browser
acceptance condition without further source changes or claiming a duplicate
staff-run browser layer.
