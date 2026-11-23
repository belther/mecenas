# Iteration 002 execution plan

Status — proposed · Revision 0.1 · 2026-11-22 · Codex

## Slice and interfaces

1. Record Nabo's approval of the exact [specification](spec.md) revision and SHA-256. Record the separate execution authorization, including the scope and remaining gaps of any exception. Use the installed 0.5.0-hub-dev package read-only.
2. After the execution gate, preserve the original test contents and test/config identities at the starting code. Provide an independent initial tester only the approved specification, interface contract and synthetic fixtures. Freeze their returned tests/design before any application change. Preserve meaningful behavioral red results against the existing behavior or a minimal contract harness; a missing import by itself is insufficient.
3. Add request-scoped state, role-specific queries and atomic mutations for applying, owner selection and artist response. Preserve existing request types, authorization helpers and integer cents. Exercise backend calls directly. Keep current paths and use the approved design plan for the workspace extension.
4. Run existing and focused tests, typecheck, optimized build, and a multi-actor development browser pass. Use separate signed-in contexts and synthetic fixtures. The conductor alone runs development backend operations and commands that require the existing local credentials. No production operations are in scope.
5. Run an adversarial pass and a separate code review with sanitized source at the approved stage. Review all test changes against the preserved original and independent baselines. Triage, repair and recheck against final source, then present results, remaining limits and a retrospective.

## Risks and meaningful verification

- Use at least one two-slot fixture with two initial offers, two queued artists and an extra eligible applicant. Include a different client and an unrelated request to check cross-request writes and reads. Keep exact numbers and account roles in the final evidence without passwords.
- Exercise simultaneous application, selection and response via backend tests, including both race outcomes and stale revisions. Use a rollback test around promotion when supported by the harness, and verify transaction boundaries in the code review. State the difference between tested outcomes and code inspection.
- Verify the artist and client agree on the same cents, slot and accepted state after reload. For queue exhaustion use one slot with no eligible backup. For closed applications accept every slot, reload and try applying from a new artist.
- Desktop and narrow-browser checks should cover keyboard reorder, clearly named controls, visible focus, announcements, confirmation, contrast, long names, touch target sizing and overflow, plus pending and stale saves. Review changed UI source against the bundled Web Interface Guidelines. Use the rules pinned in [design skills](../../../docs/design-skills.md).
- Run `npm test`, `npm run typecheck` and `npm run build`. Record tool and source identities, exact commands, test outcomes, development actor/viewport coverage and evidence limits in the iteration evidence index. Capture sanitized screenshots where useful.
- Check the Brasília freeze before committing. Normal hackathon pushes are authorized within project rules. Keep deployment and production test-account work outside this approval.

## Isolation prerequisite

The pin is `0.5.0-hub-dev`, fingerprint `1f77383f1bcc3237c60aa9b471a1f3ff5b36ff26f26644c223a47ac0ebc2a573`. The project still declares isolation unverified. The release defers verified native tester startup. The [prior boundary report](../001-accounts-profiles-requests/evidence/boundary-review.md) demonstrated shell-level packet read and outside read/write denial for synthetic canaries, but collaboration and generic resource tools remained advertised. Their effective denial, including alternate read/patch paths, is unverified. The earlier [exception](../001-accounts-profiles-requests/exception-approval.md) was for iteration 001 only. This preparation used existing files and the local review helpers. It supplied no packets, launched no workers, and collected no fresh boundary evidence.

### Proposed reduced-assurance authorization for 002

- Require Nabo's explicit approval of this route for iteration 002 and the exact approved specification. The exception covers the unverified collaboration and generic resource routes only. It never authorizes use of those tools or removing native protections.
- Start with one bounded synthetic-canary probe plus an effective tool inventory, after authorization. Require confirmed ChatGPT rather than API-key billing, fresh context and verified native root-deny/packet-read controls, disabled worker command networking, approval policy never and a minimal environment without secrets. Capture raw sanitized evidence of allowed packet reads and denied outside reads/writes via the effective local filesystem route. If required controls fail, canary data leaks, another unresolved tool route appears, or billing cannot be confirmed, stop and report. The probe is for synthetic files only.
- Keep real source, Git objects, implementation-bearing chats, credentials, account sessions, service connectors and browser context outside the initial packet. Prohibit collaboration, generic resource calls and cross-session retrieval by instruction. Those two advertised routes could still break blind testing if callable. Record them as unverified throughout. Anvil cannot certify isolation and a fresh context does not establish it.
- The initial tester may design checks without running Node; preserve their exact returned cases. If the Windows ancestor-path restriction recurs, record it and have the conductor execute the frozen cases. Use distinct fresh adversarial and code-review sessions later with explicitly scoped, sanitized source. Keep credentials and development account access with the conductor. Stop and report any unexpected access.
- If the full-assurance route is chosen, require verified bounds for all relevant tool routes, plus the effective local read/write and context checks, before any implementation or independent test dispatch. Treat missing authorization or evidence as a blocker. Keep any extended runtime work separate.

## Checkpoint and limits

Budget one synthetic boundary probe plus inventory and at most 30 minutes of setup after authorization. Report a specific blocker at that checkpoint if the route is still unavailable. Checkpoint every 45 minutes of implementation work and earlier on a material blocker. Target one initial owner review and further decisions only when scope changes or a real blocker needs one. Follow the pinned limit of one adversarial pass, one separate review and at most two combined repair/recheck cycles. Seek a bounded continuation for unresolved defects. No chargeable run is authorized.

## Test driven development exceptions

No exception to the red/green evidence is proposed. If a worker cannot execute a command, report whose run established each result. The preparation stage has no implementation, test-run, deployment or independent review results.
