# Prepare a contribution of the in-browser TS CESR walker (src/cesr) to signify-ts (h6rk4d: upstream the native-TS stream-walker)
kind: todo
created: 2026-07-21T16:01Z

- 2026-07-21T19:10Z v1 parser PREPARED on ~/code/wot/signify-ts branch feat/cesr-stream-parser (commit 5072a6b): src/keri/core/parsing.ts + export + test/core/parsing.test.ts (30 inline keripy-vector tests). All 4 CI gates green (build, lint, pretty:check, own tests). Based on upstream/main for a clean WebOfTrust PR. Remaining: maintainer opens PR (push to provenant-dev fork). v2 machinery = separate follow-up (see this.i p2rz8k / h6rk4d).
- 2026-07-21T20:53Z PR RAISED: https://github.com/WebOfTrust/signify-ts/pull/402 — from personal fork dhh1128/signify-ts (NOT provenant), base WebOfTrust:main, author dhh1128, mergeable. Adds src/keri/core/parsing.ts (side-effect-free, zero new deps) + export + 30 inline keripy-vector tests; all 4 CI gates green locally. Awaiting 2-of-3 maintainer review. v2 machinery = separate follow-up (p2rz8k / h6rk4d).
