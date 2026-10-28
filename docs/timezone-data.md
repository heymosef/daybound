# Bundled timezone rules

The app uses the `@js-joda/timezone` provider with `@js-joda/core`, pinned in
the lockfile, for offsets, date boundaries, clocks and timeline cells. Its empty
bundle loads the full reviewed rules from `src/utils/timezoneRules.json` through
the supported `ZoneRulesProvider.loadTzdbData` API before any zone is resolved.
The reviewed IANA release is **2026f**. This includes Cuba staying on UTC−04:00
until November 7, 2027, Brazil’s corrected 1965/1966 transitions, and the recent
BC, Alberta, Northwest Territories, Manitoba and Morocco changes. Rules do not depend on visitors'
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

This read-only command verifies bundled rules/source/generated metadata agreement,
then compares with IANA's current release. IANA multi-letter release suffixes
are supported. Every version discrepancy requires review, even if the endpoint
reports an older release; the checker never chooses an automatic downgrade.

| Exit | Outcome | Next step |
| --- | --- | --- |
| 0 | Timezone data current | Pinned local versions agree with IANA. |
| 1 | Timezone review needed | Review a published version difference or a missing/mismatched local provider, source or generated version. Follow the update process below. |
| 2 | Timezone check unavailable | IANA could not be checked because of a network error, 15-second timeout, HTTP error or unexpected response. Check availability before inferring whether data is current. |

The command prints the outcome and, in GitHub Actions, appends a matching heading
to the job summary. Neither failure outcome is silently converted to success.
Offline classification tests run with Node's built-in runner:

```sh
node --test scripts/test-timezone-check.mjs
```

### Scheduled and manual checks

[Timezone freshness](../.github/workflows/timezone-freshness.yml) is a separate,
read-only workflow, scheduled daily at **14:17 UTC**, with manual
`workflow_dispatch` support. It uses Node24 and `npm ci`, runs the offline checker
tests, then checks IANA once within a five-minute job timeout. Exit1 and exit2
both fail the run with distinct summary headings. Normal PR CI, installs and
builds do not depend on this external check. No packages, generated data, issues,
PRs or deployments are changed by the workflow.

Scheduling requires this workflow on the repository's default branch. GitHub
may delay scheduled runs, and schedules may be disabled in inactive repositories.
For a manual remote check after it is published, choose **Actions → Check timezone
freshness → Run workflow**. Locally, use `npm run tz:check`. GitHub run notifications depend
on the owner's repository subscriptions and account notification settings; the
owner must monitor failures and inactivity settings.

When an update exists:

1. Read IANA's release notes and the provider release notes.
2. Keep the reviewed provider/core versions unless a compatibility update is
   required. Generate the full rules for the chosen release as described below
   and commit `src/utils/timezoneRules.json`. This allows a data update while
   the provider’s npm release still bundles an older IANA release.
3. Install the corresponding exact metadata source with
   `npm install --save-dev --save-exact tzdata@VERSION`.
4. Run `npm run tz:aliases`, then `npm run tz:check`. Versions must match.
5. Update the version expectation and add regression cases for announced changes.
   If boundaries or zone IDs change, review the city-to-zone aliases and refresh
   the broader city catalogue as needed; offset updates alone cannot relocate cities.
   Run tests, typecheck, lint, audit and production build; verify transition dates
   in the browser before releasing. Review any official display-name overrides.
6. Commit the rules/source/lockfile/generated metadata together. Deployment remains a
   separate authorized action.

### Reproducing the bundled rules

`@js-joda/timezone@3.1.0` still bundles 2026e. Our 2026f rules were generated
with the provider’s own [tzdb-builder](https://github.com/js-joda/js-joda/tree/dbdecb00b7fded90be6dcb09339f1bfbb8dc3101/packages/tzdb-builder),
at commit `dbdecb00b7fded90be6dcb09339f1bfbb8dc3101`, using Node24, `zx@8.8.5`,
`make`, `cc` and `tar`. The generator downloads matching official IANA tzdata
and tzcode archives, builds zic, and packs the full historical data and future
projections. No downloaded code or data runs during app installation or build.

From a separate temporary checkout of that upstream commit:

```sh
cd packages/tzdb-builder
npm install --ignore-scripts --no-package-lock --workspaces=false --save-exact zx@8.8.5
npm run generate -- 2026f
```

Copy `packages/timezone/data/packed/2026f.json` from that checkout to this
repository’s `src/utils/timezoneRules.json`, without editing it. Review the
upstream generator before changing its pinned commit. For this update, rebuilding
2026e produced data identical to the pinned provider’s `getTzdbData()` result;
comparing the generated 2026e/2026f data showed changes only in Cuba and Brazil,
including their aliases, with no zone additions or removals.

SHA-256 provenance for this update:

| File | SHA-256 |
| --- | --- |
| `tzdata2026f.tar.gz` | `01b4a91cec5167ed48c11e8ab78f2048cead78ce94b0cafcad0ae8c5a3044d3d` |
| `tzcode2026f.tar.gz` | `5a18da01393679ef2559214dc687563f7f3d05691f6f58b7fbc0166f3e796cd6` |
| `timezoneRules.json` | `c829ee03b251fc13c452f047abd4463f32e5f072d0e050c8f5114735f8c677af` |

The empty provider bundle avoids shipping a second, stale copy of the rules.
The exported data version comes from the active provider, and contract tests
verify metadata agreement and that every selectable zone/alias resolves.
Offset, abbreviation and calendar-day regressions cover Cuba’s canceled
2026 rollback and its retained 2027 rollback, plus Brazil’s corrected history.
Browser regressions verify Havana’s clocks across the canceled 2026 rollback.
Leap-second changes in 2026f do not alter this JavaScript/POSIX clock model.

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
