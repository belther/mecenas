# Mecenas roadmap

See [product](product.md) for scope and durable decisions and [SPEC Â§10](../SPEC.md#10-10-day-build-plan) for the authoritative ten-day plan. Day-1 work is adopted as existing evidence; it is not retrospectively labelled an Anvil iteration. Iteration records will contain acceptance criteria, approvals and verification.

| Iteration | Slice | Status |
| --- | --- | --- |
| [000](../docs/day-1.md) âœ… | Existing foundation: Next.js + Convex, first public page, project rules and sandbox payment-design investigation. | Delivered before Anvil; evidence adopted. Video/initial-draft submission still pending. |
| [001](iterations/001-accounts-profiles-requests/review.html) | Accounts, artist profile/portfolio and client requests with example images; illustration artType and per-artist price. | Published with approval, 2026-11-21. Registration closed; production test accounts pending. Authenticated flows verified in development; scoped isolation exception recorded. |
| [002](iterations/002-applications-selection-offers/review.html) | Artist applications, client selection, ranked backup queue and accept/decline offers (R1â€“R4). | Implemented and verified in development, 2026-11-23. Production remains on iteration 001. |
| [003](iterations/003-sandbox-pix-payment/review.html) | Sandbox Pix payment without split, verified webhook and commission funds-held state (R5; Â§6 fallback). | Implemented and locally verified, 2026-11-23. Real sandbox webhook verified on development, 2026-11-26 ([SPEC §6](../SPEC.md#webhook-and-refund-checks--2026-11-26-brasília)). |
| [004](iterations/004-illustration-delivery/review.html) | Watermarked preview, process images, two revisions, approval, simulated release, full download and licence (R6/R7/R10). | Implemented and verified locally, 2026-11-23. [Anvil AC10 result](iterations/004-illustration-delivery/evidence/ac10-record.md). |
| [005](iterations/005-offer-review-deadlines/review.html) | 24-hour offer expiry and 72-hour automatic approval of the current eligible delivery version (R3/R8). | [Verified locally](iterations/005-offer-review-deadlines/evidence/verification.md) and [reviewed](iterations/005-offer-review-deadlines/evidence/recheck.json), 2026-11-24. Hosted rollout pending. |
| [006](iterations/006-disputes-refunds-reputation/review.html) | AI flag, platform review, sandbox refund and factual reputation (R9/Â§4). | [Implemented and verified locally](iterations/006-disputes-refunds-reputation/evidence/verification.md). Real sandbox refund verified on development, 2026-11-26 ([SPEC §6](../SPEC.md#webhook-and-refund-checks--2026-11-26-brasília)). |
| [007](iterations/007-demo-data-walkthrough/spec.md) | Synthetic demo data and end-to-end fixes; blind ratings deferred. | [Implemented and verified locally](iterations/007-demo-data-walkthrough/verification.md), 2026-11-25. Seeded on Convex development only. |
| [008](iterations/008-polish-video-setup/spec.md) | Interface polish, final demonstration video script and reproducible setup documentation. | [Implemented and verified locally](iterations/008-polish-video-setup/verification.md), 2026-11-25. Video recording by Nabo pending. |
| [009](iterations/009-deploy-polish-submission/spec.md) | Production deployment with demo data, polish (front page, stage chips, Pix note, refund labels), full test and submission texts. | Deployed to production and seeded, 2026-11-26. [Verification](iterations/009-deploy-polish-submission/verification.md). Final video and submission by Nabo pending. |

The initial idea-presentation video and sponsor-credit review can proceed separately from iteration 001. No real-money payment, paid plan or release upgrade is implied by this roadmap.

Provenance: SPEC.md Â§10 and day-1 evidence; prepared by Codex for Nabo's authorized Anvil adoption, 2026-11-20.

## Iteration 004 code review

Nabo approved one live use of the Anvil code-reviewer brief for iteration 004 on
2026-11-23. Use the instruction below at the code-review step, replacing
`NNN-name` with the actual iteration 004 folder name. The instruction is copied
verbatim from Anvil iteration 012, `evidence/ac10-instruction-mecenas.md`.

```text
Anvil asks for one live use of its new role brief (Anvil iteration 012, check AC10). Do it at the code-review step of Mecenas iteration NNN-name, instead of writing the reviewer's prompt by hand. Everything else in your iteration stays as your plan says (one separate review, your repair limits, your access rules).

1. Write a request file, for example anvil/iterations/NNN-name/evidence/brief-request.json:
{
  "role": "code-reviewer",
  "project": "C:/Users/nabor/Documents/Workspace/Personal Projects/Mecenas",
  "iteration": "NNN-name",
  "inputs": {
    "spec": "anvil/iterations/NNN-name/spec.md",
    "diff": "<the complete diff file you give the reviewer, inside the project>",
    "coder_report": "<the implementer's report or verification file>",
    "test_baseline": "anvil/iterations/NNN-name/evidence/test-baseline.json",
    "plan": "anvil/iterations/NNN-name/plan.md",
    "decisions": "anvil/iterations/NNN-name/approval.md"
  },
  "implementation_roots": ["app", "convex", "lib"],
  "output_location": "anvil/iterations/NNN-name/evidence/code-review-brief",
  "assignment": {"slot": "primary", "provider": "<provider>", "model": "<model>"}
}
Every input is one file inside the project. Add no secret, key, provider tool output, live event body or raw personal data as an input (your plan's reviewer limits still apply).

2. Build the brief with the Anvil release (Mecenas stays pinned to its own release; this only uses the helper):
python -B "C:/Users/nabor/Documents/Workspace/Personal Projects/Anvil/releases/0.6.0-briefs-dev-candidate/anvil/scripts/brief.py" build anvil/iterations/NNN-name/evidence/brief-request.json --output anvil/iterations/NNN-name/evidence/brief-code-reviewer
Run it from the Mecenas folder. Exit 0 writes brief.md and brief.json. Exit 2 is a refusal with a rule name: fix the request, do not edit the brief.

3. Start the reviewer as you normally do, with brief.md as its instruction, plus one message that gives what the brief asks the conductor for: the start, initial-test and final identities (commits or hashes); the execution evidence (test runs before and after, with result lines); the reason for each change to a frozen test; and, if no decisions file was given, a line that says no decisions apply. Before it starts, confirm the run costs no real money (subscription, not a paid API key); if unsure, ask Nabo.

4. Record in anvil/iterations/NNN-name/evidence/ac10-record.md:
   - the brief.json path, and the result of: python -B ".../brief.py" check anvil/iterations/NNN-name/evidence/brief-code-reviewer/brief.json
   - the reviewer's report file and its status reply (DONE, DONE_WITH_CONCERNS, BLOCKED or NEEDS_CONTEXT)
   - every word you added by hand beyond step 3, and every edit you had to make to brief.md (there should be none). A brief that needed hand edits to be usable is a finding.
   - anything in the brief that the reviewer found unclear, wrong or missing.

5. Tell Nabo the path of ac10-record.md so the Anvil session can close AC10.
```
