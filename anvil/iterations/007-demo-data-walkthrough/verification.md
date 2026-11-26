# Iteration 007 verification — 2026-11-25 (Brasília)

Conductor: Claude Code (Opus 5.5). Start commit: e885e26 (iterations 003–006).

## Checks

| Check | Result |
|---|---|
| `npm test` | 5 script tests and 79 Vitest tests pass (72 Vitest before 007, plus 6 seed tests and 1 watermark test). |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass. |
| Seed on Convex development (`dev:successful-fennec-849`) | Ran three times. Each run reported the six commissions in the planned states. Later runs replaced the seeded commissions and reused the five accounts. |
| Read-only walkthrough, 1280 px and 390 px | All five accounts signed in. No page errors and no horizontal overflow. |
| Action walkthrough, 1280 px and 390 px (fresh seed each) | Artist declined B, and the backup artist received and accepted it. The client got a clear error when generating a Pix without payment settings. The client selected an artist and a backup on A, asked for a revision on D, and saw the downloads and licence on E. The reviewer upheld F, and the client saw the labelled demo refund. No unexpected errors. |

Scripts and screenshots are in ignored `local-evidence/iteration-007-*` (walkthrough, actions, browser screenshots, diff).

## Walkthrough findings and fixes

1. **Watermark rendered as empty boxes (fixed).** Convex Node actions have no fonts, so the SVG `<text>` label "MECENAS · PRÉVIA" on every delivery preview showed missing-glyph boxes. This affected real deliveries, not only demo data. The label is now drawn as vector strokes (`vectorText` in `lib/image-validation.ts`), with a test that checks for no `<text>` and for light strokes inside the dark band.
2. **Deadlines showed seconds (fixed).** `formatDeadline` now uses the short time style.
3. **Misleading pending-offer text (fixed).** Before accepting, the artist read "Aguarde a confirmação do pagamento para começar". It now says that the client pays after acceptance and that work starts after confirmation.
4. **Missing site icon (fixed).** Every page requested `/favicon.ico` and got 404. Added `app/icon.svg`.
5. **Seed images carried text (fixed in the seed).** They now contain shapes only.
6. **Open, not fixed (for iteration 008):** the reviewer account is modelled as a client, so it also sees the client request form. The "Histórico de cliente" summary sits directly on top of the request form with no spacing. Full-page screenshots show blank cards because of `content-visibility: auto`; this is a screenshot artefact, not a page defect.

## Demo payment boundary

Seeded payments carry `demo: true` and no provider ID. They are labelled in both roles, and the refund job refuses them (`disputes.claim`). An upheld dispute on one ends as a labelled demo refund with no scheduled provider job (test `007 upholding a dispute…`). Real payments keep their exact previous view shape: the existing payment and delivery tests pass unchanged.

## Not verified

- The real provider webhook and the sandbox refund check: the payment settings are still absent (SPEC §6, 2026-11-25).
- No production seeding and no deployment.

## Independent review

One separate reviewer subagent (Claude, subscription; no paid API key) read the spec, the diff and the surrounding code. Status: DONE_WITH_CONCERNS, no blocker. All findings were repaired, and the checks above were run again after the repairs:

1. **Important: a reseed could delete a real sandbox payment.** Commission C is meant for the real Pix flow, and the reset deleted all payment rows under seeded requests. Now a seeded request that holds a non-demo payment, or an application from a non-demo artist, is kept and detached from the seed (`demo` removed) instead of deleted. Test: `007 reseeding keeps a commission that holds a real (non-demo) payment…`.
2. **Minor: a signed webhook with a demo reference could trigger a provider lookup.** `pix.receive` now returns 204 for a demo attempt before any provider call, and `payments.observe` refuses demo attempts. Test: `007 payment observation ignores a demo attempt`.
3. **Minor: a changed password silently stopped matching the reused accounts.** The seed now verifies the password of each existing account and stops with a clear message.
4. **Minor: target guard.** `--env-file` overrides `.env.local` for deployment selection, and the local `.env.local` has no deploy key. The script now also refuses any non-development `CONVEX_DEPLOY_KEY` or self-hosted setting. Test added.
5. **Minor: the seed was not atomic.** The reset now runs inside `populate`, after the new files exist, so a failed run changes no data and concurrent runs cannot duplicate commissions. A failed run can still leave unused files in storage.

The reviewer also suggested a heavier watermark stroke; the stroke width went from 0.9 to 1.2 grid units.

## Development state left behind

Convex development `dev:successful-fennec-849` holds the freshly seeded demo, and `MECENAS_REVIEWER_USER_ID` points to `demo-revisor`. The demo password is in the ignored `.env.demo`. Earlier synthetic test data from iterations 001–006 is untouched.
