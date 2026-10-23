# Bundled timezone rules

The app uses the full `@js-joda/timezone` provider with `@js-joda/core`, pinned in
the lockfile, for offsets, date boundaries, clocks and timeline cells. The reviewed
IANA release is **2026e**. This includes the recent BC, Alberta, Northwest
Territories, Manitoba and Morocco changes. Rules do not depend on visitors'
browser/OS timezone data and require no runtime geocoding or timezone service.
The browser is used only to detect the initial zone and format locale-neutral
calendar labels; an unknown detected zone safely falls back to UTC.

Names and backwards-compatible aliases are generated into
`src/utils/timezoneAliases.json` from the pinned development-only `tzdata`
package. Geographic link names remain searchable, so shared rules do not remove
cities such as Kampala. Existing stored timezone identifiers and custom labels
are preserved. Validation and analytics canonicalization use the same metadata.

## PCT naming

BC's September 17, 2026 announcement establishes **PCT** as Pacific Time's official
abbreviation. For America/Vancouver and its aliases, the display uses PCT from
that announcement date onward, with a UTC−07:00 tooltip. Older dates keep their
historical database abbreviations. The offset itself always comes from the
bundled rules, including the decision not to fall back in November 2026.
This display override does not apply to every BC timezone: existing local
mountain-time arrangements remain separate.

Published IANA abbreviations and official local naming can differ. Other labels
use the pinned provider's abbreviation data; numeric abbreviations are rendered
as explicit UTC offsets. A small adapter to the pinned provider's abbreviation
table has contract tests; offset calculations use its public API. Review that
adapter when changing the provider version.

## Repeatable update process

Normal installs and builds use pinned local data. They do not download latest
rules or silently change output. To check for a published update:

```
npm run tz:check
```

This read-only command verifies provider/source/generated metadata agreement,
then compares with IANA's current release. It exits unsuccessfully on stale data
or an unavailable/invalid version response. It is a maintenance check, not a
background monitor or production request.

When an update exists:

1. Read IANA's release notes and the provider release notes.
2. Install the reviewed exact provider version with
   `npm install --save-exact @js-joda/timezone@VERSION`. Update `@js-joda/core`
   only if required for compatibility.
3. Install the corresponding exact metadata source with
   `npm install --save-dev --save-exact tzdata@VERSION`.
4. Run `npm run tz:aliases`, then `npm run tz:check`. Versions must match.
5. Update the version expectation and add regression cases for announced changes.
   If boundaries or zone IDs change, review the city-to-zone aliases and refresh
   the broader city catalogue as needed; offset updates alone cannot relocate cities.
   Run tests, typecheck, lint, audit and production build; verify transition dates
   in the browser before releasing. Review any official display-name overrides.
6. Commit the source/lockfile/generated metadata together. Deployment remains a
   separate authorized action.

Published databases include historical records and future projections, not a
guarantee about unannounced laws or dates beyond the provider's projected data.
Using the full provider avoids the much shorter date limits of reduced-range
browser bundles. Future legislative changes require a reviewed data update and
release; this implementation does not promise to discover unknown rules offline.

The full rules add about 87 kB compressed to the initial JavaScript compared with
the prior build. This is the chosen tradeoff for device-independent rules and
historical edge cases. Builds report a large-chunk warning because the highly
compressible rules are bundled; runtime collection and network behavior are
unchanged.

Sources: [IANA releases](https://www.iana.org/time-zones),
[IANA changes](https://data.iana.org/time-zones/tzdb/NEWS),
[BC PCT announcement](https://news.gov.bc.ca/releases/2026CITZ0009-001073),
[js-joda timezone provider](https://github.com/js-joda/js-joda/tree/main/packages/timezone).
