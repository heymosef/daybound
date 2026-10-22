# Completion requirements and evidence map

This is the completion checklist for the user goal, not evidence that work is done. Date: 2026-10-22. Source basis: b77ff08. Fill evidence from the final worktree; indirect or missing evidence is incomplete.

| Requirement | Planned authoritative proof | Current state |
|---|---|---|
| Plans for all nine findings | 001–009 exist with current code, bounded scopes, commands, done criteria | Drafted |
| Plans for optional features only | 010–011 exist, DEFERRED; no export/overlap feature source added | Drafted |
| Recommended order and parallel work | README dependency/ownership table, followed in commits | Drafted |
| Senior staff review using GPT-6 Astra / High | Requested model/effort spawn plus reviewer verdict before first source edit | APPROVED before source edits; staff-review.md |
| Material assumptions resolved | Four direct user answers recorded in README; any new product blocker asked before dependent work | Initial decisions resolved |
| Verification baseline | Typecheck/lint configs cover source/tests/configs, repaired specific selectors, PR/Pages check gates | Pending |
| Dependency security/runtime | Supported local Node24 command evidence; clean npm ci; npm ls; high/critical audit zero; least-privilege workflows; update config | Pending |
| Stable calendar navigation | Render/rerender regressions with now changing, reopen selected month; browser flow | Pending |
| Correct fractional/DST rail | Model and rendered tests prove exact anchor, 25 elapsed-hour cells, precise fractional boundaries, UTC/fractional labels, DST gaps/repeats | Pending |
| Robust persistence | Real App/hook tests for malformed/legacy/blocked/quota cases; valid data preserved; truthful failure notice | Pending |
| Minimal analytics and durable opt-out | Initialization and whole-payload tests; no free text/default URL leakage; no replay/log/autocapture; in-flight requests aborted and no delayed dispatch; dev/no-config/blocked-storage safe | Pending |
| Fixed calendar date semantics | Actual App midnight/home-zone integration tests; fixed today remains preview; past/Today action/reload goes live | Pending |
| Performance optimization with evidence | Clock behavioral tests, meaningful conversion/render counts, before/after gzip and font waterfall/decision notes | Pending |
| Cleanup/onboarding | No debug log/scaffold/unused helper/culori, useful README/env example/AGENTS; no private values | Pending |
| Full integrated verification | One complete final supported-runtime typecheck/lint/test/build/audit run; timezone matrix; browser desktop/mobile checklist | Pending |
| Review actual implementation | Full source diff/test inspection, staff verdict, resolutions of actionable findings | Pending |
| Commits stay local | Worktree branch/log/status evidence; no pushes/PR/deployment; original checkout untouched except plans | Pending |

Before completion, reconcile this table against actual command outputs, committed files and browser evidence. Tests count as proof only when their assertions cover the requirement. A passing build cannot prove type safety or browser behavior; an audit package count cannot prove exploitability.
