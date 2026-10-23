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
the explored view holds while row clocks advance. No live analytics are used.
The offline CSP permits the app's own blob Paint Worklet while all fetches are
intercepted and connect-src remains none. This preserves the product's corner
rendering during visual checks.
