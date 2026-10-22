# Bootstrap evidence: plans 001 and 002

Implemented in the isolated worktree on `codex/daybound-maintenance`, starting from `b77ff08`. These are local checks, not a remote CI run or deployment. Plans 003–009 have not started. The reviewer owns plan status/index updates.

## Resolution and scope

- Baseline `npm audit --json`: 26 affected packages (1 low, 14 moderate, 8 high, 3 critical); package counts do not establish exploitability.
- Reachability inspection of the baseline lockfile: protobufjs came through PostHog → OpenTelemetry OTLP transformer; tar through the development dependency @tailwindcss/oxide; ws through the development test environment jsdom. Vite/Rollup/PostCSS/Browserslist findings concern the local development/build graph. PostHog's browser graph also included DOMPurify/fflate and OpenTelemetry findings; this phase updates that graph without asserting a deployed-site exploit.
- Used normal `npm install` and `npm update`, never `audit fix --force` or overrides. Vite stays 6.4 (6.4.5), Vitest stays 4 (4.1.12), PostHog stays 1 (1.438.16; React integration 1.11.3). React 18, date-fns 3 and Motion 12 are unchanged. The new PostHog graph removes the previous OpenTelemetry/protobufjs path. Rollup resolves to 4.65.0 and tar to 7.5.22. Removed unused culori and the npm-ineffective pnpm override.
- Checked npm registry peers: typescript-eslint 8.72.0 supports ESLint 8/9/10 and TypeScript >=4.8.4 <6.1.0; hooks 7.1.1 supports ESLint 10. Selected TypeScript 5.9.3 and ESLint 10.13.0. The initial ESLint 9 draft reported upstream end of support, so it was replaced before the final clean install.
- Strict no-emit source/test and Vite/Vitest config checking, recommended ESLint correctness rules plus traditional rules-of-hooks/exhaustive-deps. No application/test exclusion or correctness-rule suppression. Dependency declaration checks use skipLibCheck; imported config/plugin assignments still typecheck.
- Production source changes are type declarations, removing unnecessary casts/unused bindings/imports, and an equivalent final-position hyphen regex spelling. The test motion mock now has DOM attribute types and removes the same four animation properties. Both selector repairs preserve the expected day and month and scope queries to the Back to Today button.
- Applied the `vercel:react-best-practices` checklist to changed TSX: no new hooks, state/effect logic, component boundaries, visible copy, accessibility behavior or production rendering logic introduced. No unrelated refactors.

## Runtime and workflow proof

Node 24 was obtained via npm exec/cache, with no global runtime/default changes. `.nvmrc` contains 24 and package engines require 24.x. Final command:

```sh
npm exec --yes --package=node@24 --package=npm@11 -- sh -c 'node --version && npm --version && npm ci && npm run typecheck && npm run lint && npm test -- src/app/components/DatePicker.test.tsx src/app/App.test.tsx && npm run build && npm audit --audit-level=high && npm ls --depth=0'
```

The complete command exited 0. Clean npm ci was run once after final dependency resolution. Focused tests: 29/29 pass. Audit: zero vulnerabilities, including no lower-severity residuals. npm ls exits 0 with no invalid or unsatisfied peers.

Disposable probes: `npm run typecheck` rejected a number initialized with a string in `src/test/typecheck-probe.ts` with TS2322/exit 2; `npm run lint` rejected a debugger statement in `src/test/lint-probe.ts` with no-debugger/exit 1. Both files were removed in finally blocks before clean verification.

PR validation uses pull_request, contents:read and no credentials persisted by checkout. Pages build has contents:read; only deploy has pages:write/id-token:write. Both install → typecheck → lint → test → build; upload follows successful checks/build and deploy needs build. Analytics variables appear on the existing Pages build step only. Weekly Dependabot groups minor/patch updates; major upgrades remain separate.

Verified release tags and their commit SHAs via official GitHub release/tag APIs, and read the tagged action.yml files:

- [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1): `3d3c42e5aac5ba805825da76410c181273ba90b1`, node24.
- [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0): `949feb2413d6458794dcd2491c4babbbce0c15c1`, node24; supports node-version-file.
- [upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0): `fc324d3547104276b827a68afc52ff2a11cc49c9`, composite; internally SHA-pins upload-artifact v7.0.0.
- [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1): `368f82528645a54fb793d4d04e342629a3f51346`, node24.

Ruby/Psych parsed both workflows and Dependabot YAML; assertions confirmed sequential gates, no if/continue-on-error bypass, least-privilege permissions, full SHA action references and build-only analytics env. An initial probe used filter_map unsupported by the system Ruby; changing the probe to map.compact succeeded, with no repository change. PyYAML is unavailable locally. Remote Actions were not run.

Warnings retained: upstream whatwg-encoding deprecation; npm 11 lists four packages with install scripts not covered by allowScripts (no repository allowlist/global change made); Vite warns the 753.13 kB output chunk exceeds 500 kB. Build succeeds. Bundle optimization belongs to later approved plan 008. No application .env or analytics config was copied or printed.

## Final clean install/check output

```text
v24.22.1
11.21.1
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead for a more spec-conformant and faster implementation

added 293 packages, and audited 294 packages in 3s

64 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
npm warn install-scripts 4 packages have install scripts not yet covered by allowScripts:
npm warn install-scripts   @tailwindcss/oxide@4.1.12 (postinstall: node ./scripts/install.js)
npm warn install-scripts   core-js@3.51.0 (postinstall: node -e "try{require('./postinstall')}catch(e){}")
npm warn install-scripts   esbuild@0.25.12 (postinstall: node install.js)
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.

> daybound-web-app@0.0.1 typecheck
> tsc --project tsconfig.json && tsc --project tsconfig.node.json


> daybound-web-app@0.0.1 lint
> eslint . --max-warnings 0


> daybound-web-app@0.0.1 test
> vitest run src/app/components/DatePicker.test.tsx src/app/App.test.tsx


 RUN  v4.1.12 /Users/mohammed/.codex/worktrees/daybound-maintenance/daybound-web-app


 Test Files  2 passed (2)
      Tests  29 passed (29)
   Start at  11:12:38
   Duration  855ms (transform 148ms, setup 67ms, import 464ms, tests 615ms, environment 287ms)


> daybound-web-app@0.0.1 build
> vite build

vite v6.4.5 building for production...
transforming...
✓ 2335 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.89 kB │ gzip:   0.61 kB
dist/assets/index-_DpPlwab.css   48.30 kB │ gzip:   9.84 kB
dist/assets/index-De7TYhEy.js   753.13 kB │ gzip: 241.36 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.33s
found 0 vulnerabilities
daybound-web-app@0.0.1 /Users/mohammed/.codex/worktrees/daybound-maintenance/daybound-web-app
├── @eslint/js@10.0.1
├── @posthog/react@1.11.3
├── @tailwindcss/vite@4.1.12
├── @testing-library/jest-dom@6.9.1
├── @testing-library/react@16.3.3
├── @testing-library/user-event@14.6.8
├── @types/node@24.19.2
├── @types/react-dom@18.3.7
├── @types/react@18.3.31
├── @vitejs/plugin-react@4.7.0
├── clsx@2.1.1
├── date-fns-tz@3.2.0
├── date-fns@3.6.0
├── eslint-plugin-react-hooks@7.1.1
├── eslint@10.13.0
├── globals@16.5.0
├── jsdom@26.1.0
├── lucide-react@0.487.0
├── motion@12.23.24
├── posthog-js@1.438.16
├── react-dom@18.3.1
├── react@18.3.1
├── tailwind-merge@3.2.0
├── tailwindcss@4.1.12
├── tw-animate-css@1.3.8
├── typescript-eslint@8.72.0
├── typescript@5.9.3
├── vite@6.4.5
└── vitest@4.1.12

```
