# Iteration 004 verification

2026-11-23 (America/Sao_Paulo) · Codex conductor

## Application checks

- `npm test` passed 2 Node tests and 43 Vitest tests. The four new delivery
  tests exercised role and funding gates, private file access, incomplete
  and cross-offer submissions, two revisions, stale and concurrent operations,
  an exact 5000-cent simulated release and the original bytes after approval.
- `npm run typecheck` and `npm run build` passed. A transient check attempted
  while the reviewer packet was present picked up its incomplete source copy.
  The conductor archived that packet and reran both commands on the workspace.
- The [browser walkthrough](browser-results.json) passed at 1280px and 390px.
  The real delivery controls used the real Convex application functions in a
  synthetic test backend over a loopback test transport. It verified the
  visible watermark, process captions, two revisions, approval, state after
  reload, and both downloads. See `local-evidence/iteration-004-browser/`
  for the harness, screenshots and local Convex launch log. The anonymous
  local Convex CLI could not fetch its backend version. The verified browser
  run used harness-provided sessions and did not use hosted transport.
- The [adversarial pass](adversarial.json) traced all of its supplied diff and
  reported no findings. It was static. The conductor ran the synthetic tests.
  Runtime storage cleanup timing and a backend write outage were not tested.
- The [independent code review](code-review-brief/report.md) checked the
  final source and requested the missing baseline files. The
  [targeted recheck](baseline-recheck.json) matched all 11 original files and
  the frozen new test. See the [AC10 record](ac10-record.md) for the outcome.

## Source and external status

- Starting source manifest SHA-256
  `6286238a9a0a2d1abf8c3ee3cd66ef37810fbd0cd6a2aad870f99f563179a444`.
  It includes iteration 003's matching working-source hashes.
- The 004-only diff in ignored `local-evidence/iteration-004-implementation.diff`
  has SHA-256 `cce3ff17767aab1d3be380d283275b6d212b4938970674d3f57d686c9fe7c3c7`.
  Final changed-source identity manifest SHA-256
  `a5dccf93a53aec096772082a17da4490e126f8fafab72177855af617f545781b`.
- No deployment, hosted setup change or provider payment took place in this
  iteration. The actual iteration 003 webhook test remains pending owner setup
  confirmation as recorded in [SPEC §6](../../../../SPEC.md#6-payments-abacatepay-test-mode).
