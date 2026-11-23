# Iteration 002 retrospective

2026-11-23 (America/Sao_Paulo) · Codex

- The initial canary tested shell reads and writes and listed the standalone
  patch tool. Including Add File and Update File attempts in that initial
  probe would have avoided a second approval and a second native startup.
  Keep both patch attempts synthetic. Shell denials do not establish the
  behavior of a separately exposed patch tool.
- Keep stale review packets out of the TypeScript include tree when running
  the product build. Preserve their manifests and original contents. Type
  checks should run against the actual workspace source.
- Record the difference between concurrent test submissions to a serialized
  harness and concurrent calls to Convex development. Test-only write fault
  injection made it possible to verify rollback and retry without exposing
  a fault switch in a public mutation.
- Browser development used synthetic accounts in separate contexts. The
  security and access prerequisites for a signed-in production demo remain
  the iteration 001 release decision.
