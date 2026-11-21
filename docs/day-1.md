# Day 1 — 2026-11-20, America/Sao_Paulo

Author: Codex. Status: public first page and Convex verified; GitHub push pending.
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
- Vercel: https://mecenas-azure.vercel.app (also mecenas-vamo-ve.vercel.app).
  First deployment READY; public login protection disabled with Nabo's explicit
  approval on 2026-11-20. Browser verified the public page and `Convex conectado`.
  Deployment id: dpl_8bkGremL2knUHEG9fqQCDvFCE9HJ. Vercel team plan: Hobby.
- Convex dev: successful-fennec-849; production: peaceful-salmon-164. Code/schema
  deployed to both; each remote `health:check` returned `status: ok`.
  Nabo created all three service accounts and entered the keys locally himself.
- AbacatePay: synthetic split payment and full refund executed; R$50 remained
  credited after refund, confirming the documented failure of (b). Runtime (a)
  stays unverified because sandbox has no withdrawals. See SPEC §6 for evidence
  limitations and the simulated platform-funding payment needed for refund.
- Free Vercel Hobby and Convex Free are documented. Keep pay-as-you-go and paid
  upgrades off. AbacatePay sandbox uses simulated funds without real charges.
- Hack Brasil project-draft submission remains a manual/account task; no draft
  has been submitted by this session. Nabo will open the site to fill the empty
  project information together next. The now-available public page can be added
  there. Initial presentation video is still missing.

## Account setup follow-up — 2026-11-20, 22:20 Brasília

- API keys are in ignored `.env.local`; key values were not printed. The Convex
  personal token is separate from any future production deployment key.
- Vercel CLI link attempted automatic GitHub connection, which was rejected by
  Vercel because no GitHub Login Connection was present. CLI deployment still
  worked. No GitHub repository access was granted and nothing was pushed.
- Vercel deployment upload dry run confirmed `.env.local`, local evidence,
  tooling, Git metadata and local build outputs were excluded.
- Local screenshot: `local-evidence/mecenas-public.jpg`. Public demo approval was
  required after automatic review rejected the initial protection change. Nabo
  explicitly approved making it public before the setting was changed.
- No paid plans, custom domains or production financial actions were enabled.

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
