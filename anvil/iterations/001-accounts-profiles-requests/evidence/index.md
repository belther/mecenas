# Iteration 001 evidence

Status: implemented and verified locally against the development backend, then
published with owner approval on 2026-11-21. Production registration stays closed;
production test accounts and authenticated production verification remain pending.
See [release evidence](../../../../docs/deployment-001.md).

Workflow: 0.5.0-hub-dev; fingerprint
`1f77383f1bcc3237c60aa9b471a1f3ff5b36ff26f26644c223a47ac0ebc2a573`.
Approved specification SHA-256:
`e22b4f2d6130bf2e9904ba4ade10663c27c0be84adc27625d75ad9311d1a57e8`.

- [Specification](../spec.md), [plan](../plan.md), [owner approval](../approval.md).
- [Scoped exception approval](../exception-approval.md) and [boundary evidence](boundary-review.md).
- [Frozen independent design](initial-design.json), [freeze identity](initial-design-freeze.json), [starting test identities](test-baseline.json).
- [Callable red baseline](red-baseline.test.mjs): three expected behavioral failures.
- [Verification and test-change review](verification.md).
- [Initial adversarial findings](adversarial-initial.json), [separate code review](code-review-initial.json).
- [Recheck 1](code-review-recheck.json), [final recheck](code-review-final-recheck.json).
- [Final source identities](final-source-manifest.json) and [retrospective](../retrospective.md).

Review source manifests and native usage files sit next to their corresponding
results. Raw event logs, account records and screenshots stay in ignored
local-evidence. No application credential was included in a worker packet.
The original specification/plan's draft-state sentences are historical; the
approval and exception records establish execution authority. Full isolation
remains unverified. No Anvil source was copied into this application.
