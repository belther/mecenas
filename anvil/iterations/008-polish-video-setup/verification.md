# Iteration 008 verification — 2026-11-25 (Brasília)

Conductor: Claude Code (Opus 5.5). Start commit: 5b25e19 (iteration 007).

## Checks

| Check | Result |
|---|---|
| `npm test` | 5 script tests and 82 Vitest tests pass (79 before 008, plus 3 workspace-view tests). |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass. |
| Read-only walkthrough, 1280 px and 390 px, all five accounts | No page errors, no horizontal overflow. `demo-revisor`: review queue shown; no "Editar perfil", no history summary, no form outside the queue (AC1). No other account shows the review queue. |
| Action walkthrough, 1280 px and 390 px (fresh seed each; 007 script) | Same results as 007: B decline moves the offer to the backup, who accepts; A selection; D revision; E downloads and licence; reviewer upholds F; client sees the labelled demo refund. The only console error is the expected "Pix de teste indisponível nesta configuração" (payment settings absent). |
| Seed | Ran three times on `dev:successful-fennec-849`; development was left freshly seeded. |

Scripts and screenshots are in ignored `local-evidence/iteration-008-*`.

## Changes and findings

1. **Reviewer-only view (AC1).** `lib/workspace-view.ts` picks the workspace from `api.disputes.queue`, which returns `null` for anyone who is not the configured reviewer. The reviewer sees a "Revisão da plataforma" heading, the queue and "Sair" only. Server checks are unchanged. Tests: `tests/workspace-view.test.ts`.
2. **History block spacing (AC2).** `.reputation` had no styles. It is now a bordered block with a 44 px summary and 32 px below it; inside request cards it keeps a small top margin.
3. **Reviewer select** had browser-default styling; it now matches the other inputs.
4. **Narrow reviewer "Sair"** was indented by the quiet-button padding; fixed.
5. **Next.js dev indicator** (the "N" badge) covered page content in screenshots and would show in the video. `devIndicators: false` in `next.config.js`. The error overlay still appears for real errors in development.
6. **README:** new "Current state" and "Quick start for judges" (install, `convex:dev`, `demo:seed`, reviewer ID, `.env.demo`, account table). Checked that Convex Auth 2.1 (`convexAuthProvider()`) signs with the deployment's own key, so a fresh deployment needs no JWT variables; development has none set and sign-in works.
7. **Video:** `docs/video/roteiro-final.txt`, Portuguese script and shot list for all eight SPEC §8 steps, mapped to commissions A–F, with the payment honesty rule (approval decision 3).

## Not fixed (for Nabo)

- Earlier synthetic test requests from iterations 001–006 (for example "Verificação sintética de concorrência 002", "Jardim imaginário — versão final") still appear in the artists' "Encomendas abertas" list. They are synthetic but clutter the video. Removing them changes development data and needs Nabo's decision.
- Full-page screenshots show grey thumbnails below the fold: `loading="lazy"` images are not fetched by a full-page capture. Not a page defect.

## Not verified

- A run of the README quick start on a brand-new Convex deployment (AC4 was checked by reading the scripts and the auth provider, not by a fresh clone).
- The real provider webhook and the sandbox refund check: payment settings are still absent (SPEC §6).
- No deployment, no production seeding.

## Independent review

One separate reviewer subagent (Claude, subscription; no paid API key) read the spec, approval, full diff and surrounding code. Status: DONE_WITH_CONCERNS, no important defect. It confirmed hook order, no client-form flash for the reviewer, unchanged server checks, CSS specificity, the account table and the auth claim. All eight minor findings and nits were repaired:

1. README: wait for "functions ready" before `demo:seed` (race with `convex:dev`).
2. README: Iara's row now lists her application on A.
3. Script: steps 3 to 6 all change data; reseed to record again.
4. Script: declining needs "Confirmar recusa".
5. Script step 5: narration no longer suggests escrow ("pagamento simulado ... sem custódia real").
6. Script step 7: on-screen text quoted exactly.
7. Script: aim for a 2:45 read.
8. README: run the reviewer line in the same folder.

Checks were run again after the repairs (documentation-only changes; tests, typecheck and build unchanged and passing).
