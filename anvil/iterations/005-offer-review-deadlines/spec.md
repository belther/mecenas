# Iteration 005 — unanswered offers and delivery deadlines

Draft for Nabo's review · Revision 0.1 · 2026-11-24 (Brasília)

## Your decisions

1. Approve the proposed deadlines and rollout. Give an artist 24 elapsed hours to answer an offer and the client 72 elapsed hours to review each submitted delivery version. This gives the backup queue a daily turnover and the client three days to inspect the art. A 48-hour offer window would give artists more time at the cost of a slower queue. Start a full window for existing pending offers and deliveries awaiting review when their deadlines are first assigned. Test the demo with a controlled clock.
2. Approve the iteration-specific worker exception described in the [plan](plan.md), conditional on a fresh successful boundary check. Alternatively, wait for full isolation verification. The existing pin reports isolation unverified.

## Important context

An offer gets a server deadline when the client sends it. An artist can accept or decline before that time. At or after the deadline, expiry wins even if the scheduled job runs late. Record expired offers distinctly from declines. In the same transaction, release the slot and offer it to the next eligible artist in the saved queue. A promoted artist gets a full response window. If the queue is exhausted, the slot becomes available for selection. Only pending and accepted offers reserve slots.

Each published delivery version starts a fresh client review window. Show the due date and time in Brazilian Portuguese with the Brasília time zone and explain what silence will do. A timely revision request stops that version's clock. Work in progress, accepted offers awaiting payment, superseded versions and deliveries held for review are ineligible for automatic release. The AI flag and dispute workflow belongs to iteration 006.

At the review deadline, approve the current eligible version automatically. Record the reason as deadline elapsed, simulate exactly one release for the funded offer amount and unlock the same original file and written licence as manual approval. A late manual request cannot reverse the result or consume a revision. Both participants see whether approval was manual or automatic. No external payment operation is involved.

## Acceptance checks

- A1 — Exercise the instant before, at and after offer expiry. Race acceptance and decline with expiry. Retried jobs, an empty queue and two expiring slots never promote one artist twice or reserve a slot twice.
- A2 — Submit a funded delivery. Run the scheduled callback early, on time and again. Observe one release at the saved cents, the correct approved version, the licence and authorized original download. Verify client and artist views after reload.
- A3 — Race a revision or manual approval against the deadline. After a timely revision, an old callback cannot release funds for the revised delivery or while the artist works. Exercise delayed execution and repeated callbacks after manual approval.
- A4 — Existing pending offers and eligible review versions receive one full window. Repeating initialization preserves their dates. Expired, declined, accepted or already approved records retain their historical outcome. Previously approved records remain readable.
- A5 — Verify timestamps, reason labels and disabled or resolved late actions on desktop and narrow screens. Run focused scheduler tests, the full suite, typecheck and optimized build.

## Provenance

Nabo's [product spec](../../../SPEC.md) defines backup promotion under R3, automatic release under R8 and simulated settlement under §6. The [roadmap](../../roadmap.md) places both deadlines in iteration 005. The durations and rollout above are proposed for approval.
