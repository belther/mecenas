# Iteration 006 — disputed illustrations, Pix refunds and reputation

Draft for Nabo’s review · Revision 0.1 · 2026-11-24 (Brasília)

## Your decisions

1. Approve a private human-review queue for the demo. A separate synthetic reviewer designated by Nabo can decide a case after inspecting the watermarked preview, process images and the client's explanation. The reviewer cannot decide a commission they participate in. Upholding the flag starts a full sandbox Pix refund. Dismissing it approves the flagged version and simulates the artist’s release. Approval includes one end-to-end provider check on a dedicated synthetic commission, once development funding is verifiable.
2. Approve the reputation definitions below. Count distinct commissions per artist offer. Show the artist's on-time rate as “Sem prazo de entrega registrado” until commissions have agreed delivery dates. Adding an artist delivery deadline now would also change request creation and offer acceptance.
3. Approve the same narrowly scoped worker exception for 006, conditional on a fresh successful check. The two unverified routes are described in the plan. Waiting for verified worker isolation remains an option.

## Important context

A client can flag suspected AI use on the current funded delivery before its 72-hour deadline. A timely flag freezes review immediately. The original and licence stay locked, and scheduled release, manual approval and revision stop. At the exact deadline the existing automatic approval wins. Both participants see the current status after reload. The private reviewer records a decision and a short explanation. The review uses human judgment.

If the reviewer upholds the flag, the client loses in-app access to every delivery version and receives no licence. Mecenas cannot recall images already displayed by a browser. The artist keeps their own submitted work. The client sees “Reembolso pendente” until AbacatePay confirms the full refund against the matching test payment. Failure or lost confirmation leaves a recoverable pending case with the files locked. Dismissing the flag grants the same original, personal-use licence and simulated release as approval. One case can produce only one financial outcome.

Artist profiles show completed commissions, upheld flags and the availability of an on-time rate. Client profiles show commissions originally paid, including later refunds. Show separate rates for commissions with at least one revision request and commissions ultimately rejected after an upheld flag. Both denominators are distinct paid commissions that reached first delivery. Display numerator and denominator, with “Sem histórico” for a zero denominator. Show flags raised and flags upheld separately. Replays, later versions and repeated revisions do not double-count. Participants can see these facts where they choose a commission or an artist. Dispute explanations stay private.

## Acceptance checks

- A1 — Exercise flag submission just before, at and after the review deadline and race it with revision, manual approval and the scheduler. Verify one outcome, the correct version and no release while held.
- A2 — In separate client, artist and reviewer sessions, check reviewer-only access, conflicts of interest, case evidence and the two rulings. Attempt original and historical file reads through normal file access paths. Check both participants after reload.
- A3 — Verify full refund amount and matching test payment. Exercise concurrent decisions, duplicate notifications, insufficient balance, and provider success followed by a lost local response. Reconcile before retrying. No path may both refund and release.
- A4 — Use a small ledger with known counts including a legacy commission, multiple versions, repeated revisions, a pending case, an upheld flag and a dismissed flag. Verify the displayed facts, denominators and empty state.
- A5 — Test the real screens in Brazilian Portuguese at desktop and narrow widths, run focused checks, the full suite, typecheck and optimized build. Record local results and actual sandbox observations separately. An unobserved provider result stays pending.

## Provenance

Nabo requested the next roadmap iteration on 2026-11-24. The governing product decisions are [R7–R10 and reputation](../../../SPEC.md). The proposed reviewer access and metric definitions need Nabo’s decision. AbacatePay documents full refunds, the refunded charge state and insufficient-balance handling in its [refund guide](https://docs.abacatepay.com/pages/vender/reembolsos).
