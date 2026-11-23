# Mecenas roadmap

See [product](product.md) for scope and durable decisions and [SPEC Â§10](../SPEC.md#10-10-day-build-plan) for the authoritative ten-day plan. Day-1 work is adopted as existing evidence; it is not retrospectively labelled an Anvil iteration. Iteration records will contain acceptance criteria, approvals and verification.

| Iteration | Slice | Status |
| --- | --- | --- |
| [000](../docs/day-1.md) âœ… | Existing foundation: Next.js + Convex, first public page, project rules and sandbox payment-design investigation. | Delivered before Anvil; evidence adopted. Video/initial-draft submission still pending. |
| [001](iterations/001-accounts-profiles-requests/review.html) | Accounts, artist profile/portfolio and client requests with example images; illustration artType and per-artist price. | Published with approval, 2026-11-21. Registration closed; production test accounts pending. Authenticated flows verified in development; scoped isolation exception recorded. |
| [002](iterations/002-applications-selection-offers/review.html) | Artist applications, client selection, ranked backup queue and accept/decline offers (R1â€“R4). | Implemented and verified in development, 2026-11-23. Production remains on iteration 001. |
| 003 | Sandbox Pix payment without split, verified webhook and commission funds-held state (R5; Â§6 fallback). | Planned. |
| 004 | Watermarked preview, process images, two revisions, approval, simulated release, full download and licence (R6/R7/R10). | Planned. |
| 005 | Scheduled offer timeout and automatic release after client silence (R3/R8), respecting active revision/dispute state. | Planned. |
| 006 | AI flag, platform review, sandbox refund and factual reputation (R9/Â§4). | Planned. |
| 007 | Synthetic demo data and end-to-end fixes; optional blind ratings only if time permits. | Planned. |
| 008 | Interface polish, final demonstration video and reproducible setup documentation. | Planned. |
| 009 | Submission checks, buffer and final delivery before the freeze. | Planned. |

The initial idea-presentation video and sponsor-credit review can proceed separately from iteration 001. No real-money payment, paid plan or release upgrade is implied by this roadmap.

Provenance: SPEC.md Â§10 and day-1 evidence; prepared by Codex for Nabo's authorized Anvil adoption, 2026-11-20.
