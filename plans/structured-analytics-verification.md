# Structured settings and reference-city analytics

User authorized restoration of structured settings choices and the manually
chosen reference city after discussing the overly broad previous exclusion.
Search sampling and normal PostHog retention remain unchanged. Work is local;
no PostHog project reads/writes, live test traffic, dashboard changes, push,
deployment, or global runtime/model configuration change.

## Implementation

- New settings_changed event allowlists five setting names and their fixed
  values. Only explicit changes emit events; no initial/restored/current-state
  snapshot, no-op clicks, opt-out replay or person properties.
- home_timezone_changed now carries canonical reference_timezone, and standard
  reference_result_id/city/country only when validated against the fixed picker
  and matching timezone. Editable labels/custom country/row IDs are excluded.
- New picker additions retain standard city metadata separately from their
  editable labels using the existing local row city field. This also works with
  analytics off. Earlier rows without reliable city metadata report timezone
  only; no guessing from labels or treating the reference as physical location.
- Existing transport consent/DNT/GPC, ephemeral page identity, development and
  loopback guards, cancellation, and anonymous event flags remain in force.
- Settings copy and docs/usage-analytics.md describe the restored fields and how
  to create Trends reports. No live reporting or historical backfill is claimed.

## Verification

Focused runtime projection/App integration tests passed. One initial test had
an ambiguous Seattle text selector during listbox exit animation; it now waits
for the actual listbox exit before renaming. No production fix was needed.

Final candidate under scoped Node 24/npm 11: typecheck PASS, lint PASS (zero
warnings), 17 test files / 338 tests PASS, production build PASS, offline fixture
build PASS, and all three pre-existing synthetic SQL report checks PASS.
React checklist: action handlers own capture, effects/restoration stay silent,
state setters have no capture side effects, callback dependencies are complete,
no eager city-catalogue imports or added dependencies, runtime allowlists enforce
privacy, and the existing keyboard/focus behavior is preserved.

Actual browser verification used the real App behind the offline fixture's
intercepted fetch and fake token, with CSP disabling remote connections:

1. Startup: zero requests. Change 24H to 12H, light to dark, TE-1 to Gamut,
   disable badge and weekend indicators: exactly five settings_changed events,
   with only setting/value plus the existing anonymous/GeoIP-disable flags.
2. Select Seattle, rename it Private team Canary, navigate to the same fixture
   without reset: custom label survives, startup emits zero requests.
3. Explicitly make that row home: reference_city Seattle, reference_country USA,
   reference_result_id America/Los_Angeles|Seattle, reference_timezone
   America/Los_Angeles. Neither editable label nor row ID is recorded.
4. Make old fixture UTC row home: only reference_timezone UTC plus the transport
   flags; no guessed city is added.
5. Opt out through real Settings, then switch appearance: two pending home events
   are aborted, zero pending requests remain, and no settings request is added.

The original checkout receives the verified local commit by fast-forward. Its
existing preview at 127.0.0.1:4173 is rebuilt; normal local collection stays off.
