# Iteration 004 — illustration delivery and approval

Status — draft for Nabo's review
Revision 0.1 · 2026-11-23 · Codex

## Your decisions

1. Approve revision 0.1 for implementation and synthetic verification. I recommend one fixed personal-use licence for the hackathon demo. The client can keep the artwork and display it for personal use, including on personal profiles with artist credit. The demo licence excludes commercial use, resale and transfer, and says the artist retains copyright. The artist sees the terms before first delivery. The client sees them before approval and receives the agreed terms alongside the final download. Per-offer licensing could support commercial commissions, but would require terms selection and agreement earlier in the offer flow.
2. Choose the Anvil execution path. I recommend an iteration 004 exception for the unverified collaboration and generic resource routes, conditional on a fresh synthetic boundary check. The alternative is to wait for full verification of those routes. The [execution plan](plan.md) describes the limits. Nabo's prior approval of AC10 applies to the code-review brief. The iteration 003 isolation exception applies to iteration 003.

## Important context

### Delivery and review

- Only the selected artist can submit files for their accepted, funded offer. A ready delivery contains one full-quality JPEG, PNG or WebP and exactly two or three process images. The app generates a visible, reduced-size watermarked preview from the final image. Preserve the validated original for download. Reuse the existing image size and format limits.
- The owning client sees the watermarked preview, process images, delivery version and actions to approve or request a revision. A failed upload or incomplete submission leaves the previous commission state available for retry. The process images and preview are visible to the offer participants.
- The client can request up to two revisions, each with a short instruction for the artist. Each request applies to the currently submitted version. A new submission uses the same required file set. Keep the revision notes and version numbers. After each request, the client reviews the next delivered version before making another decision. After two requests, the client can approve the latest delivery once it is submitted.
- The client approves the exact version currently awaiting review. Approval records one simulated release for the saved offer amount in cents and unlocks that version's original and written licence for the client. The artist sees which delivery was approved and the amount marked as a simulated payout. Both views persist after reload.
- AI flags, refunds, scheduled approval or offer expiry, provider payouts and production deployment belong outside this slice.

### Access and retry behavior

- Scope all reads, file access and actions to the correct offer and role. Signed-in users outside the commission and anonymous callers cannot read its delivery or download its files. Authorize access to files server-side. Public storage URLs and original file identifiers stay out of client-facing data before approval. The client can download only the approved version's original.
- Review transitions require the current delivery version. Repeated and concurrent approval, revision and submission requests cannot double a release, consume a revision twice, approve a stale version or change the approved version. An approval and a revision request for the same version cannot both succeed.
- Work from the verified funded state in iteration 003. Synthetic fixtures may exercise iteration 004 locally. A fixture establishes the delivery behavior. The actual Pix webhook check remains tracked in [SPEC §6](../../../SPEC.md#6-payments-abacatepay-test-mode).

### Acceptance checks

- A1 — Funded and authorized. Check the owning client, recipient, other users and anonymous callers, including an accepted offer awaiting payment. Verify role checks on the operations and file responses.
- A2 — File completeness. Verify two and three process images, invalid files and counts, failed upload retry, a watermarked preview derived from the final file, and preservation of the validated original.
- A3 — Revision limits. Run a first delivery, two valid revision requests and their replacement deliveries. Verify stale actions, duplicate requests and concurrent actions leave the right version and revision count. Reject a third revision.
- A4 — Approval and release. Check the expiry-free manual flow at an exact amount of 5000 cents. Verify one simulated release under replay and concurrency, access to the approved original and stored licence, and persistence after reload. Confirm the approved version remains fixed.
- A5 — Workspace walkthrough. Use synthetic client and artist sessions in the existing Brazilian Portuguese workspace. Verify the review, revision and download controls at desktop and narrow widths. Run the suite, typecheck and optimized build.

## Provenance

Prepared by Codex on 2026-11-23 from [SPEC.md](../../../SPEC.md), the [Mecenas roadmap](../../roadmap.md) and [iteration 003's verification](../003-sandbox-pix-payment/evidence/verification.md). The fixed licence, file limits and iteration 004 execution exception are proposals for Nabo's review.
