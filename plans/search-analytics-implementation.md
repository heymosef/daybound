# Linked search discovery analytics

Implemented locally from94ade73 in the existing managed worktree, branch
codex/search-analytics. User requested missing cities, follow-up searches and
what people eventually select. This is a new bounded feature after the original
maintenance work; its historical review artifacts do not certify this new diff.

## Confirmed policy

The user first chose filtered unknown words with seven-day retention. Current
PostHog documentation establishes that ordinary events do not support a separate
seven-day deletion policy. On being asked about that limitation, the user
explicitly chose filtered sampled words under the project's normal longer
retention. No backend, deletion promise, account retention change or deployment
was introduced. Custom row labels remain excluded.

## Implementation

- GeoNames cities15000 derivative:34,179 standard city records with provenance,
  SHA256 and CC BY4.0 attribution.27 initial-letter chunks lazy-load from the
  application's own assets, never from a geocoding service. Exact/ASCII/country
  matching; ambiguous names retain a standard name without a guessed country.
  Picker results are unchanged. Supported city names whose search fails are
  separated from actual missing-picker names by search_match_failure.
- SearchJourney produces version2 attempted/selected/closed events, temporary
  in-memory IDs, ordered attempts,700ms settled queries and immediate final
  choice/close. Clear preserves context; selection/observed close ends it.
  Journeys roll after30minutes/100 distinct attempts. A common case/space edit
  with unchanged results does not generate another attempt.
- Approximately10% of random journeys can include at most3 eligible failed,
  unrecognized terms. Whole-input rejection covers emails/URLs/digits/control
  characters/secret markers/oversize input;64characters/5words maximum. This
  reduces risk without promising all personal text can be recognized.
- Transport projection independently validates IDs, bounded fields and samples;
  public city properties are rebuilt from catalogue/picker values. No custom
  labels, arbitrary selected strings, URLs/referrers or identity profiles.
  Legacy count-only no-result events remain for existing charts.
- Synchronous controller subscription revokes pending classification even if
  React batches off/on. Opt-in does not replay existing text. Current consent is
  still checked at dispatch; no SDK/retry/beacon/unload delivery was added.
- Settings discloses sampled search words and provides public data credits.
  Three local PostHog SQL templates and setup instructions are in docs/.
  No live insights/dashboard were created; templates must be schema-checked
  after the new events exist in the selected production project.

## Verification

One full candidate run passed304tests before browser inspection. Actual browser
inspection then found a closed Settings menu's existing outside-mousedown
listener stealing focus and incorrectly ending a result selection. An initial
null-blur guard alone did not fix it. A temporary DOM focus trace isolated the
closed-menu listener; it is now registered only while Settings is open. Added
null-blur and native-pointer-with-Settings regressions. Temporary diagnostic
fixture code was removed. No result-pointer behavior override remains.

After that source correction, the authoritative final run used locally scoped
Node24.22.1/npm11.21.1:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
npm ls --depth=0
node scripts/browser-fixtures.mjs
python3 scripts/check-search-reports.py
git diff --check
```

All passed:16files/306tests, both type projects, lint0, valid package graph,
audit0 vulnerabilities, production and intercepted-fixture builds. The report
checker uses documented HogQL-to-SQLite equivalents and synthetic data to test
missing counts, consecutive follow-ups, duplicate isolation, same-page different
searches, reused synthetic IDs across pages, first failure, actual choice,
same-timezone alternatives and unknown/explicit-close outcomes. It does not
claim live HogQL parser/schema execution. The final command log is temporary
/tmp/daybound-search-final.log; this is its durable summary.

Product initial JS409.11kB/130.48gzip, CSS49.09kB/10.01gzip. The wider catalogue
is not in the initial chunk:27 files, largest212.91kB/51.96gzip. Utrecht's U
chunk is18.63kB/5.75gzip; Amsterdam's A117.97kB/31.16gzip. No chunk-size warning
or blanket configuration suppression. Source city data is approximately1.86MB
before compression, split for on-demand use. No CPU or battery claim.

## Actual CUA browser layer

An isolated loopback fixture on port50292 mounted the real App/provider, fake
public token/.invalid ingestion host, intercepted every fetch and denied network
connections with CSP. sampleSearches=1 forced only fixture journeys into the
sampled bucket. Native UI interactions, DOM snapshots and request envelopes:

- Utrecht: no results, known NL city2745912, absent from picker.
- Follow-up Amsterdam: same search_id/attempt2; ambiguous name kept ambiguous.
- Actual pointer selection: Amsterdam/EuropeAmsterdam, GeoNames2759794, same
  journey; no false focus-left close after the Settings fix.
- Vancuver: filtered sample recorded. person@example.com was absent from complete
  envelopes. Standard London selected by quick Enter, with city2643743 after
  resolving the picker's UK abbreviation.
- Already-added Amsterdam: available0/already1, no_results=false, missing=false.
- Escape closed the observed journey. Opt-out changed14pending to0/14aborted;
  off-state input produced no additional requests. Reload retained Off with0
  startup requests. A final fresh-source replay of the two linked journeys
  produced10requests, all10aborted on opt-out.
- Only relevant catalogue partitions were observed (u,a,v,p,l); no all-catalogue
  download. The offline clock is fixed, so these envelopes show elapsed0; pure
  tracker tests verify advancing elapsed time.

Sanitized final observed event/property evidence, with fake tokens/headers
excluded, is in search-analytics-browser-events.json. Fixture remote-font CSP
messages are expected and are not production browser errors. The original
localhost preview remains the normal product path with analytics disabled.

## Boundaries

All code, catalogue, templates, tests and documentation are local. PostHog tools
were used for documentation/skills only; no project reads/writes or test traffic
were sent to an actual project. No push/deployment/global model/runtime change.
The original checkout will receive the verified local commit by fast-forward,
and its already-running preview will be rebuilt for the user.
