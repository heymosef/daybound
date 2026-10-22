# Timeline fractional-label layout correction

Date: 2026-10-22. Base source:80d6be4; evidence-only handoff8406860.

## Trigger and bounded change

Primary actual desktop CUA verification found adjacent fractional 24-hour labels
visually overlapping (Kathmandu13:45/14:45). The desktop minimum1.75em allowed
cells narrower than a five-character hour label. The accepted mobile minimum
3.25em already accommodated these labels.

Remove only the desktop narrowing override, retaining the shared3.25em minimum
at all breakpoints for every row and both formats. Do not widen only fractional
rows: shared cell geometry,25 elapsed instants, alignment, date boundaries,
marker/hover behavior and label contents remain unchanged. Source changes are
limited to Timeline.tsx and its focused rendered test.

The two-format regression renders UTC,Kolkata,Kathmandu together, verifies25
cells and identical absolute instants in each row, confirms a real five-character
13:45 label in24-hour mode, and enforces the same width floor without responsive
narrowing. jsdom does not perform text layout; this test documents the policy
and shared alignment, not a measured non-overlap claim. Primary CUA owns actual
label/cell bounding-box verification in the rebuilt production candidate.

## Verification

Locally scoped Node24.22.1/npm11.21.1:

```sh
npm exec --yes --package=node@24 --package=npm@11 -- sh -c 'npm test -- src/app/components/Timeline.test.tsx src/utils/timeline.test.ts && npm run typecheck && npm run lint && npm run build && node scripts/measure-bundle.mjs && node scripts/browser-fixtures.mjs'
```

All exit0:2files/36tests pass, both TypeScript projects pass, ESLint zero
warnings, product build2022modules, final fixture build2024modules. The complete
257-test suite at80d6be4 is not repeated for this bounded style-only delta;
focused verification includes the two new rendered policy/alignment cases.

Updated in-memory bundle: JS397847bytes /126447gzip; CSS48840 /9989gzip;
index.html2027 /658gzip. Compared with008 before the correction, JS is18raw/6gzip
bytes smaller; CSS40raw/13gzip smaller. This is a layout correction, with no
startup/performance-speed claim.

Production dist and ignored fixtures were regenerated in place. Existing servers
continue serving updated paths: production127.0.0.1:4175 (session66605), offline
fixture127.0.0.1:4176 (session56808). Fresh browser navigation is needed to load
the new hashed assets. No live analytics or external project traffic was used.

Working and cumulative whitespace checks pass. Prior combined-source staff
approval applies to80d6be4; this delta requires bounded source review and actual
browser label-bounds evidence before final completion. No other source was
changed or additional features implemented.
