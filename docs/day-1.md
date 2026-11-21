# Day 1 — 2026-11-20, America/Sao_Paulo

Author: Codex. Status: local implementation verified; external setup pending.
Canonical requirements: SPEC.md and Nabo's launch request, 2026-11-20.

## Implemented

- Durable shared hackathon rules in AGENTS.md; no Anvil setup or package access.
- Next.js 16.4.6, React 19.3.1, Convex 1.51.0, TypeScript and npm lockfile.
- Original Portuguese landing page with explicit unfinished-demo status.
- Convex health query and client connection indicator. No URL means explicitly
  unconfigured, not a fabricated connection.
- Day-2 draft schema: artist/client profiles, portfolio storage references,
  requests, per-artist price and illustration artType. No public data mutations.
  Authentication, upload flow and profile/request forms remain unimplemented.
- Experimental local sandbox probe and focused safety/evidence tests.
- Standard installation and dev/production setup in README.md.

## Verification

- `npm install`: completed.
- `npm run build`: passed, including TypeScript and static page generation.
- `npm test`: passed two tests (production/missing-key rejection before network;
  distinguishing reversal, retained split and inconclusive balance evidence).
- `npm run payments:probe`: expected blocked result, no .env.local/test key;
  no external API calls. Ignored local evidence JSON saved.
- `npm run typecheck`: passed. Environment files and local evidence confirmed
  ignored. Local production page loaded in the Codex browser; text and visible
  layout inspected. No remote deployment or backend connection was inferred.

## External status and next steps

- GitHub first push: not authorized yet. Repository is public; first push would
  publish this source/spec. No service secrets or real customer records included.
- Vercel: not deployed; Nabo confirmed no account yet. URL: none.
- Convex dev: not connected. Production: not connected. Health query not remotely
  executed. Nabo confirmed no Convex account yet. Account creation and key entry
  belong to Nabo.
- AbacatePay: runtime facts (a)/(b) not executed. Official docs contradict (b)
  and prohibit sandbox payouts, activating the preapproved fallback; see SPEC §6.
- Free Vercel Hobby and Convex Free are documented. Keep pay-as-you-go and paid
  upgrades off. AbacatePay sandbox uses simulated funds without real charges.
- Hack Brasil project-draft submission remains a manual/account task; no draft
  has been submitted by this session. Nabo will open the site to fill the empty
  project information together next. He also confirmed no AbacatePay account.

## Remaining decision

Authentication provider is not chosen in the spec. Research current suitable
options and obtain Nabo's choice before adopting a substantial auth dependency.
Do not publish unauthenticated profile writes/uploads as a shortcut.

## Reusable method

Canonical utility: `scripts/abacatepay-probe.mjs`; usage, inputs, side effects,
output, limitations and source references are in README.md. Preserve it here,
not inside Anvil. Local tests are evidence of safeguards, not API behavior.
Vault cross-index capture is pending: this session's writable roots exclude
RNabo Vault. Do not claim vault capture was completed.
