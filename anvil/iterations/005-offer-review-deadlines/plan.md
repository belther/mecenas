# Iteration 005 execution plan

Proposed · Revision 0.1 · 2026-11-24 (Brasília)

## Slice and interfaces

1. Record Nabo's decision on the exact specification and execution path. Snapshot the effective working source and existing tests so iteration 003 and 004 changes stay identifiable.
2. Persist server-assigned deadlines. Schedule internal Convex mutations in the same transaction as offer creation or delivery submission. Callbacks check persisted deadline, identity, state and version at execution. Use server time for decisions and display the saved instant in Brasília time.
3. Reuse the decline path's slot-release and queue-promotion logic and the approval path's release transaction. Include the cause of the transition in role-appropriate projections. Ensure late user actions can settle a due transition without throwing away the write through a transaction rollback.
4. Use bounded, retryable initialization for eligible records without deadlines. Assign each a full future window and schedule its job atomically. Handle replies, submissions or manual approval racing initialization. Never infer a missed deadline from the age of a legacy record.
5. Verify through the normal offer, revision, approval and file access paths. Record source identities, commands, runtime evidence, worker reports and limits. Exercise synthetic records locally. Hosted rollout or deployment requires separate approval.

## Risks and meaningful verification

Freeze an independent spec-only design and show a behavioral failure before implementation. Drive the scheduler with a test clock. Inspect the resulting queue, occupied slots, approved version and release records as well as each role's screen. An obsolete callback must be harmless even if cancellation failed. Make the automatic release conditional on the positively eligible review state so future dispute states stay closed by default.

## Isolation prerequisite

Use the pinned 0.5.0-hub-dev workflow. Earlier exceptions are iteration-specific. The proposed 005 exception covers only the unverified collaboration and generic resource routes, which workers may not use. Run one bounded native probe with synthetic canaries: allowed packet read, denied relative and absolute outside reads, denied shell write, and denied standalone patches to existing and absent targets. Verify file identities and absence of new outside files. Require fresh context, a minimal environment, disabled worker command network, approval policy never and subscription sign-in. Stop on a failed protection or additional unresolved route. Exclude browser, live service and payment access from worker packets.

## Checkpoint and limits

Allow one startup check and up to 30 minutes of setup. Check in at 45 minutes of implementation or earlier for a material blocker. Run one adversarial pass and one separate review, with at most two combined repair and recheck cycles. Include all referenced baseline files in the reviewer's restricted packet and keep temporary source copies outside TypeScript discovery. Capture actual usage when available.

## Test driven development exceptions

None proposed. The conductor may execute independently designed cases and must identify who ran each check.
