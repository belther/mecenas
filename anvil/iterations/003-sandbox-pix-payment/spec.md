# Iteration 003 — sandbox Pix payment

Status — draft for Nabo's review
Revision 0.1 · 2026-11-23 · Codex

## Your decisions

1. Approve revision 0.1 for implementation and synthetic verification on the existing Convex development backend. This includes a development HTTPS endpoint for AbacatePay's test notifications. The proposal reuses an open Pix charge, reconciles any uncertain charge before offering a retry, and tells the artist to start only after the exact payment is verified. Nabo enters any required sandbox secrets and configures the sandbox webhook when the development endpoint is ready.
2. Choose the Anvil execution path. Recommended: approve a new exception scoped to iteration 003 for the unverified collaboration and generic resource routes only, subject to one bounded native filesystem and standalone patch check. Alternatively, require full worker isolation before dispatch or implementation. The iteration 002 exception is historical evidence and carries no authority into 003. Details are in the [execution plan](plan.md).

## Important context

### Outcome

From a request with an accepted offer, the owner creates a sandbox Pix charge for the offer's saved per-artist amount in BRL cents. The client sees the QR code, copy-and-paste code and expiry. The selected artist sees “Aguardando pagamento” until Mecenas verifies that exact sandbox charge. Both sides then see the confirmed demo payment. The artist view says “Pagamento de teste confirmado. Você pode começar nesta simulação.”

The approved SPEC §6 fallback keeps the charge in the platform's test balance and records the artist's entitlement in the app at the exact offer price. Keep the existing accepted offer and its reserved slot. The payment or commission record adds the funded state. Payout simulation, delivery, refunds, expiry of unanswered offers and production custody belong to later work.

### Who can act and what is stored

- Only the owning client can create, retrieve or retry a charge for an accepted offer. A request whose applications have closed can still have accepted offers awaiting payment. Other clients, artists and anonymous callers cannot create or see the Pix code. Only the recipient can see the artist's payment status for their own offer.
- Apply SPEC §5 at the first payment. Use an approved format-valid synthetic CPF fixture only. Normalize and validate it server-side and persist only a keyed hash. The same client can keep paying their other offers. A different account cannot claim the same CPF. Do not log the input or send it to AbacatePay when the API does not require it. This does not certify the payer's identity.
- Use test mode only. Client-visible data excludes secrets, CPF hashes, raw provider events and internal reconciliation details. Clearly label Pix and funded screens as part of the demo. Keep real funds, split, fees added to the buyer, transfers, cards, boleto and refunds outside this iteration.

### Payment transitions

- Awaiting payment → preparing charge. An authorized owner requests Pix. Reserve one attempt per offer atomically using a stable reference and the price copied from the offer. Concurrent requests reuse that attempt. Only the caller that claims the creation step may submit it to AbacatePay.
- Preparing charge → awaiting Pix. Persist the provider's charge identity, exact amount, expiry and safe payment instructions after validating the sandbox response. Reopen or reload to see the same open charge. Keep the artist waiting.
- Preparing charge → checking charge. A timeout, uncertain provider response or failure to save the returned charge can mean the provider already created it. Reconcile safely using the stable reference. If the outcome remains ambiguous, show a pending verification message and keep the artist waiting. A missing search result alone does not authorize another charge.
- Unpaid charge → replacement available. Offer a manual replacement only after a definitive failed creation or when AbacatePay reports the old charge unpayable and unpaid. Use a fresh reference for the replacement. Pix charge expiry leaves the offer accepted and the artist waiting. It neither releases the slot nor promotes a backup.
- Awaiting Pix → funded. Verify the provider's v2 completion notification, then confirm the canonical charge in the sandbox with its stored provider ID, offer association and exact amount. Apply the funding change atomically with the event record. Both a repeated event ID and a new event ID for the same payment leave one funded record. Client browser signals, pending charges, unknown or mismatched charges and production events cannot unlock work. An authenticated client refresh may re-run the same server verification to recover a missed notification.
- A later stale notification cannot undo funding. If a second distinct paid charge is reported for an already funded offer, preserve the original entitlement, record the conflict with sanitized evidence and leave automatic refunds outside this slice.

### Interface

Keep the current cream/green workspace and offer wording. Place “Gerar Pix de teste” beside the accepted offer and the per-artist price. Show the expiry time in Brazilian Portuguese, with a copy button and a usable text code alongside the QR. Give copying, pending verification and retry clear text feedback. Allow keyboard use and narrow-screen wrapping. In the artist view, show awaiting payment or sandbox payment confirmed on the existing offer card.

### Acceptance checks

- A1 — Eligibility and privacy. Test the owner, another client, the recipient, another artist and anonymous callers. Pending and declined offers cannot be charged. Accepted offers on a closed request still can. Old iteration 002 accepted offers start in awaiting-payment state.
- A2 — CPF fixture. Accept the approved synthetic format, reject invalid and unapproved input, prevent two clients from claiming it concurrently, allow same-client reuse, and prove plaintext is absent from stored or logged records.
- A3 — Exact price and recoverable creation. A R$50,00 offer on a three-slot request produces a 5000-cent sandbox Pix charge without split. Concurrent requests create one active attempt. Test retry and recovery after request timeout and after provider success followed by a local persistence failure.
- A4 — Verified notification. Reject invalid secret or signature, malformed payload, production mode, wrong charge and mismatched amount. A pending provider read or failed lookup keeps the artist waiting. Verify that a valid sandbox completion can fund the right offer, and that repeats, new event IDs, out-of-order delivery and a concurrent refresh cannot fund twice.
- A5 — Expiry and conflicting payments. A provider-confirmed expired unpaid charge permits replacement without releasing the slot. A late or conflicting event cannot reassign the offer or create a second entitlement.
- A6 — Development walkthrough. Two roles using synthetic accounts see matching states across reload at desktop and narrow widths. The conductor creates and simulates one sandbox Pix and observes the actual HTTPS webhook delivery and resulting state. Record exact limitations if sandbox delivery fails. Run tests, typecheck and optimized build.

## Provenance

Prepared 2026-11-23 from [SPEC §§5–6](../../../SPEC.md), the [roadmap](../../roadmap.md) and the [iteration 002 specification](../002-applications-selection-offers/spec.md). The detailed retry policy and test-only CPF fixture workflow are proposed here for owner review.
