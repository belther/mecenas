# Iteration 009 — production deployment, polish, full test and submission

Revision 0.1, 2026-11-26 (Brasília). SPEC §10 days 9–10.

## Goal

Put the current app online with click-through demo data, fix what a judge would
see as unfinished, test every flow at both widths, and draft the Portuguese
submission texts before the freeze (2026-11-30 23:59).

## Scope

1. Deploy main to production (Convex peaceful-salmon-164, then Vercel).
2. Seed demo commissions A–F on production behind an explicit `--production`
   flag, with a separate ignored password file `.env.demo.production`.
3. Tidy development data for the video: close the two stale open test requests
   and rename the commission that holds the real sandbox payment.
4. Design changes approved by Nabo (numbering from the design review):
   - D1 Front page: current product text and an "evaluate" block with the demo accounts (no password).
   - D2 When the sandbox Pix is not configured (production), the client sees a note instead of an error.
   - D3 A stage chip on each commission in the client's list.
   - D5 After a refund, the payment label no longer says "confirmado"; no empty licence bar.
5. Full tests: unit and integration tests, typecheck, build, action and read-only walkthroughs at 1280 px and 390 px.
6. Portuguese submission texts for Nabo.

## Acceptance criteria

- AC1 Production serves the current main; the public page shows "Convex conectado".
- AC2 Production has commissions A–F and the reviewer setting; a demo sign-in works (checked by Nabo: Claude may not enter passwords on a production site).
- AC3 D1–D5 as above, with tests for D2, D3 and D5.
- AC4 `npm test`, `npm run typecheck` and `npm run build` pass.
- AC5 Walkthroughs at both widths over all accounts: no page errors, no horizontal overflow.
- AC6 Submission texts drafted; records, roadmap and README updated; committed and pushed before the freeze.

## Out of scope

Payments on production, D4 (heading order) and D6 (narrow order), schema changes, recording the video.
