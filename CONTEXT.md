# betanyc/nyc-checkbook-mcp context
> refreshed 2026-08-27 | upstream default: main @ 507f904

## Identity & policies
- upstream: betanyc/nyc-checkbook-mcp, default branch `main`, primary language TypeScript, English-first (yes)
- CLA/DCO: none (no CLA/DCO tooling in CONTRIBUTING or .github)
- AI-assisted PR policy: allowed, disclosure expected — CONTRIBUTING: "We neither encourage nor prohibit AI coding tools here... If you used a generative tool for any part of a contribution, say so in the pull request."
- signed commits required: no (no branch protection on upstream main)
- PR template: none (`.github/PULL_REQUEST_TEMPLATE.md` absent) → fall back to pipeline 4-section body
- external tracker: github

## Conventions (verified from merged PRs)
- branch naming: `fix/...`, `docs/...`, `feature/...`, `refactor/...`, `ci/...` — dominant `fix/` and `docs/` (e.g. `fix/verify-contract-filters`, `fix/sub-vendor-columns-1.6.1`, `docs/api-surface-probe`)
- commit style: imperative, lowercase-ish, issue refs in subject/body
- test command: `npm test` == `npm run build && node --test test/*.test.mjs` (offline, fixtures only, no network)
- CI: `.github/workflows/ci.yml` — `npm ci` + `npm test` on Node 20.x + 22.x, triggered on PR to main for `**/*.ts`, `test/**`, `package.json`, `package-lock.json`, `.github/workflows/**`
- release workflow only on tags; never on PRs/branch pushes
- how outside PRs merge: single-maintainer repo; all merges by noneck (Noel Hidalgo). No outside-contributor merges seen in history.

## Maintainer picture
- active maintainer: Noel Hidalgo (github `noneck`), BetaNYC director. Sole author of every commit and every merged PR.
- responsive: merges own PRs quickly; repo actively maintained (last push 2026-08-20).

## Issue-area health
- Open issues are all maintainer-authored (`noneck`). No open PRs.
- #34 [bug] Runtime surface still recommends smart_search (disabled) — VERIFIED present in current code (v1.6.1).
- #32 [question] local corpus cost — informational.
- #28 [enhancement] EPIC domain map / API limits.
- #27 [documentation] EPIC well-behaved API client.
- #11 [documentation] outreach to Comptroller — external.
- #10 [enhancement] contracts extra columns — partly landed via #31/#33.
- #8 [enhancement] sub-vendor fields — landed via #33 (1.6.1).
- Avoid: smart_search's own tool description (SMART_SEARCH_DISABLED_MESSAGE) and its registration MUST stay — the tool stays registered by design (issue #25, no breaking surface change). The fix must only stop OTHER tools' descriptions from recommending it.

## Gap ledger (dedupe — READ FIRST, never re-pick)
- (no prior attempts)

## Mined gaps (discovered, not yet attempted)
- 2026-08-27 docs/runtime-text bug issue #34: VENDOR_NAME_UNSUPPORTED_MESSAGE option (3) recommends smart_search; search_contracts vendor_name describe "(use vendor_code, or search_spending/smart_search for name search)"; get_contract description "Use this after finding a contract ID via smart_search or search_contracts." — all recommend a disabled-by-default tool. Repro: grep tools.ts for smart_search in message/description strings; `npm test` (add regression test). Dedupe: issue #34 open, no upstream PR references it; merged PRs (#26/#25 gate, #33) did NOT remove these recommendations. — status: proposed
