# Iteration 004 execution plan

Status — proposed · Revision 0.1 · 2026-11-23 · Codex

## Slice and interfaces

1. Record the exact approved specification revision and SHA-256, and record the chosen execution path. Preserve iteration 003's original source and evidence as the starting point. Establish a reproducible pre-004 source identity before app changes so that the implementation diff contains only iteration 004.
2. Snapshot the existing tests and configuration. Freeze an independent design from the approved spec and interfaces. Demonstrate a behavioral failure before implementation. Synthetic fixtures may establish the existing funded state for local delivery verification.
3. Add delivery, review transitions and a simulated release to the accepted funded offer. Use Convex storage, the existing auth and image tooling, and server-authorized file responses. Keep the original bytes separate from the watermarked derivative. Recheck the offer, role and delivery version in the transaction that changes review state. Record the simulated release and the approved version together. Keep the currency, exact offer cents and licence snapshot on the approved delivery or release.
4. Extend the offer views in the existing workspace. Verify direct file access and mismatched offer or version requests, revision and approval concurrency, and the client and artist journey at desktop and narrow widths. Run the full suite, typecheck and optimized build. Keep verification synthetic, with any service configuration or deployment covered by its own approval.
5. Run one adversarial pass and one independent code review. At the code-review step follow the [Anvil AC10 instruction](../../roadmap.md#iteration-004-code-review). Build the brief with the 0.6.0 candidate helper while keeping the project pinned to 0.5.0-hub-dev. Give the reviewer only the sanitized files and conductor context listed in that instruction. Use one subscription-backed review, confirm it carries no real-money cost and record the helper check, findings, reviewer report and actual status in `evidence/ac10-record.md`.

## Risks and meaningful verification

- A UI access rule alone is insufficient for media. Check file responses as the approved client, the artist, unrelated users and anonymous callers. Test access before approval and after approval for the final and superseded versions. Keep previews and process images scoped to their offer. Strip embedded metadata from review images when producing derivatives.
- Delivery can race with revision or approval. Test stale version actions, repeated and concurrent actions, and retry after a partial upload. Failed or incomplete uploads must not advance state or expose private files.
- Record initial and final source identities, focused and full test results, and approval and download persistence. Attribute checks to the role that actually executed them. The synthetic release must be visibly labelled in both views and verified without a provider operation.

## Isolation prerequisite

Full isolation remains unverified. The iteration 003 exception and canary are historical evidence. Under a new iteration 004 exception, run one bounded synthetic boundary check using the actual worker setup before dispatch. Check an allowed packet read, denied absolute and relative implementation reads, denied outside shell write and denied standalone patch to existing and absent outside canaries. Verify canary hashes and the absence of unexpected files.

Require fresh context, disabled worker command networking, approval policy never and a minimal environment using the existing ChatGPT subscription. The proposed exception covers only the unresolved collaboration and generic resource routes. Prohibit their use by workers and exclude service, browser and payment access. Stop if the check fails or exposes any additional unresolved route. The blind designer receives only the approved spec, interfaces and permitted fixtures. The adversarial tester and code reviewer receive sanitized materials after the test design freezes.

## Checkpoint and limits

Allow one combined boundary check and up to 30 minutes of setup after approval. Check in at 45 minutes of implementation or sooner for a material blocker. Use one adversarial pass, one separate review and at most two combined repair and recheck cycles. Record unresolved issues if they remain. Check the Brasília freeze before committing.

## Test driven development exceptions

None proposed. If the independent designer cannot run the harness, the conductor runs the frozen cases and records who ran each check.
