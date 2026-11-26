# Iteration 007 — synthetic demo data and end-to-end fixes

Revision 0.1, 2026-11-25 (Brasília). SPEC §10 day 8.

## Goal

One command fills a Convex deployment with synthetic accounts and commissions in
every state the SPEC §8 demo needs. Walk through the result on desktop and narrow
screens, and fix what the walkthrough finds.

## Scope

1. `npm run demo:seed` creates five synthetic accounts and six commissions. Running
   it again removes the earlier seeded commissions and creates them again with the
   same names, so the result is reproducible. Accounts are kept and their profiles
   are reset.
2. The seed runs as internal Convex functions. Only a deployment administrator can
   run them. Public registration stays closed.
3. A commission that the seed marks as paid has a payment record marked
   `demo: true`. It has no provider charge. The app shows
   "Pagamento de demonstração — sem cobrança no provedor" wherever it would show a
   confirmed test payment, and never calls AbacatePay for it.
4. An upheld dispute on a demo payment ends as a demo refund: no provider call,
   labelled "Reembolso de demonstração — sem provedor".
5. Fixes for defects found in the walkthrough, each with a test where practical.

## Seeded commissions

| # | State | Demo use (SPEC §8) |
|---|---|---|
| A | Open, two applications, no selection | Select an artist and a backup |
| B | Pending offer to artist 1, artist 2 queued as backup | Decline moves the offer to the backup |
| C | Accepted, waiting for payment | Real sandbox Pix once payment setup exists |
| D | Demo-funded, version 1 in review | Ask for a revision, approve, or flag AI |
| E | Demo-funded, one revision, version 2 approved and released | Download and licence |
| F | Demo-funded, version 1 disputed (open) | Platform review |

## Acceptance criteria

- AC1 The seed refuses a production deployment name and a password shorter than 12 characters.
- AC2 After the seed, each seeded account can sign in, and each commission is in the state in the table.
- AC3 Running the seed twice gives the same commissions and no duplicates.
- AC4 Every demo payment shows the demo label to client and artist. No demo payment reaches a provider call.
- AC5 Real (non-demo) payment, delivery and refund behaviour is unchanged: the existing tests pass.
- AC6 `npm test`, `npm run typecheck` and `npm run build` pass.
- AC7 Desktop (1280 px) and narrow (390 px) walkthroughs of client, artist and reviewer flows on the seeded data, with findings and fixes recorded.

## Out of scope

Blind ratings (decision 6), production seeding, deployment, real payments.
