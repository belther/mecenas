# Iteration 001 plan

## Slice and interfaces

Implement the approved revision of spec.md. First resolve decision 1 (authentication) and record decision 2 (exact specification revision and SHA-256 approval). Do not install an auth package or write application behavior while those decisions remain open. Keep project records and tests in Mecenas; use the pinned Anvil package read-only.

1. Verify the execution prerequisites below using synthetic canaries and a bounded packet. No worker may receive implementation-bearing chat history, .env.local, service tokens, payment tools, unrelated project material or unrestricted connected-account access. Record actual model/runtime identity; do not invent provider/model or cost measurements.
2. Freeze independent initial behavioral test design for sign-in, profile/request persistence, validation, roles and ownership. Plan contract fixtures before changing the application schema. Record starting and frozen-design test/configuration identities using the pinned snapshot helper. No test-count quota.
3. Demonstrate meaningful initial behavioral failures against a minimal contract harness; missing imports alone do not count as red evidence. Record any exception and alternative verification honestly.
4. Add the chosen auth integration and server identity helpers; preserve the public landing page. Add profile/request/upload records and explicit safe response projections. Confirm installed package signatures and peer compatibility from the actual package.
5. Implement owner-scoped backend functions and upload validation, then Portuguese onboarding/profile/request/list screens in the existing visual direction. Use generated Convex types and validate publication server-side.
6. Run focused behavioral tests and synthetic browser scenarios, build/typecheck and development backend checks. Workers receive only the approved packet or a sanitized source checkout, never the credentialed working directory. The conductor alone uses existing local dev credentials after the relevant tests.
7. After the initial design freezes and implementation passes, run a distinct adversarial tester and separate code reviewer under verified permitted access. Source visibility may be granted in this later phase, explicitly recorded. Triage reproducible findings, compare tests/configuration to both baselines and recheck fixes against final code.
8. Present the working local/dev slice, evidence, limits and remaining production-demo decision. Commit/push within existing authorization. Keep production deployment separate. Write a short retrospective.

## Risks and meaningful verification

- Auth/session mistakes: test valid, invalid, restored and revoked sessions. Do not use a hidden client-supplied owner ID as authority.
- Ownership and role boundaries: exercise anonymous caller, artist A, artist B and client C; attempt direct backend calls as well as UI navigation.
- Storage: valid synthetic JPEG/PNG/WebP; oversized, mislabeled and non-image fixtures; mismatched foreign storage IDs; count/race checks; rejected/orphan cleanup. No real portraits, contact details or financial records.
- Money input: parse BRL input deterministically into integer cents; check zero/negative/fractional-cent/overflow values and per-artist wording. No charge, refund or transfer requests occur.
- Atomic publication/persistence: invalid draft stays private, valid publication persists once, refresh preserves saved state, duplicate saves do not create duplicate identity profiles.
- User feedback: empty, auth-loading, submission-pending, backend unavailable and failed-upload states. Test one narrow and one desktop viewport.
- Test changes: retain red and green outcomes, commands, tested commit/file hashes and justified repairs; independent review checks weakened or removed assertions.

## Isolation prerequisite

Current actual mechanism: none verified for a Mecenas independent initial tester. anvil.yaml declares isolation unverified. No worker has been dispatched. Allowed packet-read and denied source/credential-read probes have not been run. A new session/worktree and the package fingerprint do not establish read isolation.

After approval, inspect the pinned references/isolation.md route and current native runtime capabilities. Build a packet with only the approved spec, interfaces and synthetic fixtures. First test the boundary with synthetic allowed-file and outside-packet canaries, not real source or secrets. The worker environment must exclude application/API keys, connectors, browser sessions and other cross-session/source retrieval routes. Demonstrate relevant routes denied before real independent testing. Record actual native invocation, effective tool list and raw sanitized probe evidence. If capability/context gaps persist, stop and report them.

The 0.5.0 manifest itself lists verified native startup as deferred. Do not inherit another project's historical denial results. The current application helper scripts with account credentials are conductor-only and must not be provided to a worker. No scoped reduced-assurance exception is approved or assumed. Future 0.6.0 role briefs are not installed functionality and do not automatically change this pin or prerequisite.

## Checkpoint and limits

Preparation: one concise owner review covering the two numbered decisions. After approval, checkpoint after 30 minutes of boundary/setup work; report a concrete blocker rather than expanding infrastructure indefinitely. During implementation, checkpoint at 45-minute elapsed-work intervals and earlier on a material blocker. Owner-attention target: initial approval plus material decisions only, not each reversible implementation choice.

Pinned pilot limit: one initial adversarial pass, one independent code review and at most two combined repair/recheck cycles. Ask for a bounded continuation if required work remains after that; do not waive a defect to meet the limit. No additional charge is authorized. Actual token/cost/allowance records will be reported only if available.

## Test driven development exceptions

No exception has been granted. The day-1 scaffold predates this iteration and is adopted as existing evidence, not claimed as independently tested Anvil work. Generated bindings, formatting and documentation can use proportionate direct verification; permission/ownership/payment-related behavior needs meaningful behavioral checks. Failed imports or unexecuted commands are not behavior evidence.
