# Iteration 009 verification — 2026-11-26 (Brasília)

Conductor: Claude Code (Opus 5.5). Start commit: 618bf1f (iteration 008 plus the 2026-11-26 sandbox checks).

## Deployment

| Step | Result |
|---|---|
| `npx convex deploy` to production (peaceful-salmon-164), main 618bf1f | Schema validation passed. Only new tables and indexes were added; production held one empty `users` row and no profiles, requests or uploads (AC1). |
| `vercel deploy --prod` (team vamo-ve, project mecenas) | READY. https://mecenas-azure.vercel.app shows "Convex conectado"; `/painel` loads with no console errors (AC1). |
| `node scripts/demo-seed.mjs --production` | A–F created on the production deployment; the reviewer user ID appeared only in production's `users` table. `MECENAS_REVIEWER_USER_ID` set with `--prod`. Production has no other environment variables (no payment settings) (AC2). |
| Redeploy after the changes below (standing approval, decision 2) | Convex and Vercel READY. The public page shows the new front page and "Convex conectado". |

AC2 sign-in on production: **not checked by Claude**. Claude's safety rules forbid typing a password into a production website. Nabo checks it with the password in the ignored `.env.demo.production`.

## Development data tidy (decision 6)

A temporary internal mutation, never committed, closed the two open test requests "Verificação sintética de concorrência 002" and "Jardim imaginário — versão final". It renamed the non-demo commission that holds the real sandbox payment to "Rótulo para café — Pix real no sandbox (teste de 26/11)". Its payment and refund rows are unchanged. The mutation file was removed and development was redeployed without it.

## Changes

1. **D1 front page** (`app/page.tsx`, `app/globals.css`): current product text; a demo-account list with usernames only; the password stays in the submission form. The step 02 text says reserve and payout are simulated.
2. **D2 Pix note** (`lib/pix-config.ts`, `convex/payments.ts`, `app/painel/payments.tsx`): `payments.view` adds `pixUnavailable: true` for the client when the sandbox settings are missing. The client sees a note instead of "Gerar Pix de teste". `lib/pix-provider.ts` now uses the same settings rule.
3. **D3 stage chips** (`lib/commission-stage.ts`, `convex/requests.ts`, `app/painel/page.tsx`, `workspace.css`): `requests.mine` adds one stage per commission (pending and accepted offers only). Stages where the client must act are filled.
4. **D5 refund labels** (`payments.view`, `payments.tsx`, `deliveries.tsx`): "reembolsado" after a refund, "Reembolso de teste em andamento" while pending; no empty licence paragraph.
5. **Seed** (`scripts/demo-seed.mjs`, `convex/demoData.ts`): `--production` flag and its own password file; clearer messages for the Convex Auth rate limit and the production password file.
6. **Docs:** README current state, production seed, rate-limit note; `docs/submissao.md` with the Portuguese submission texts (AC6).

## Checks

| Check | Result |
|---|---|
| `npm test` | 6 node tests and 87 Vitest tests pass (82 at the start of 008's close; new: stage and Pix-config unit tests, A–F stages, Pix note, demo refund labels, pending refund label, declined backup offer, production flag). |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass. |
| Action walkthrough, 1280 px and 390 px, fresh seed each (`local-evidence/iteration-009-actions.mjs`, a copy of the 007 script that creates no sandbox charge) | All steps passed: B decline moves to the backup, who accepts; A selection; D revision; E downloads and licence; reviewer upholds F; client sees the labelled demo refund. No page errors. |
| Read-only walkthrough, 1280 px and 390 px, all five accounts, on the final code | No page errors, no horizontal overflow; reviewer sees only the review queue. Client list shows: F "Em revisão da plataforma", E "Aprovada", D "Entrega para avaliar", C "Aguardando Pix", B "Oferta enviada", A "Publicada", sandbox commission "Reembolsada". |

Screenshots and logs are in ignored `local-evidence/iteration-009-browser/`.

## Finding: sign-in rate limit on shared accounts

Convex Auth 2.1 limits password checks per account (token bucket: 5, then 1 per minute). The first walkthrough runs failed because the script signed in as `demo-cliente` more than 5 times within a minute. The seed failed for the same reason, because it checks each account's password once. This is library behaviour, not an app bug. Effect on judges: several judges who sign in to the same account within the same minute can see "Muitas tentativas" for a minute. Once signed in, a judge stays signed in. Mitigation: README and the submission text say to wait a minute or use another account. Extra client accounts were offered to Nabo as option 2 and not built.

## Not verified

- AC2 production sign-in (Nabo).
- The Pix note seen on screen on production: the client view on production needs a sign-in. An integration test covers it (`tests/demo.test.ts`, "009 the client list…").
- A live duplicate webhook replay (unchanged from SPEC §6).

## Independent review

One separate reviewer subagent (Claude, subscription; no paid API key) read the spec, approval, full diff and surrounding code. Status: DONE_WITH_CONCERNS. Repairs:

1. Important: step 02 card implied custody → now says reserve and payout are simulated.
2. Important: Pix note named letters D, E and F that judges never see → names the stages instead.
3. Pending refund still read "confirmado" → `refundPending` flag and label, with a test.
4. Declined backup offer, rejected delivery without a dispute record, and finished-offer priority → tests and a comment.
5. Pix settings rule repeated in two places → `sandboxKey` and `cpfSettings` shared by `pix-provider.ts`.
6. Stage query read offers one at a time → parallel reads.
7. Seed messages: name `.env.demo.production`; the rate-limit wait only helps with the right password.
8. JSX inside the request card simplified.

Not changed: the public list of demo usernames (the accounts already exist on production and production registration is closed, so nobody can claim them; the lockout exposure is the rate limit above). The review suggested checking that `--prod` works with `--env-file`: the production run shows it did. The reviewer user ID exists only in production's `users` table.
