# Iteration 002 execution boundary review

2026-11-23 (America/Sao_Paulo) · Codex · Partial verification

Nabo approved the [scoped exception](../exception-approval.md). The approved
plan allowed one synthetic native probe with inventory. The shell checks passed.
That first run left the standalone patch route open. The
[subsequent targeted check](patch-boundary.md) records its resolution.

## Probe and observations

- Codex CLI reported `0.171.0-alpha.13` and login status reported ChatGPT.
  The launch used a fresh ephemeral session, native Windows MXC permissions
  with root denied and packet read allowed, command networking disabled by
  configuration, no escalation within the worker, and an allowlisted process
  environment. No app secrets, real source, or account data were supplied.
- The outer workspace sandbox blocked CLI startup before any worker/model event.
  The reviewed host launch with the native worker sandbox produced the single
  completed probe. It took 21.28 seconds.
- The native event log shows the expected synthetic marker returned with exit
  0 from the packet. Both relative and absolute outside-file reads reported
  explicit access denial with exit 1. The conductor verified the outside file
  existed. The write probe exited 1 with access denied, and the target stayed
  absent. These operations used PowerShell through `exec_command`.
- The inventory listed `functions`, `clock`, and `collaboration` as direct
  namespaces. The deferred tools were `apply_patch`, `clock__curr_time`,
  `exec_command`, `list_mcp_resource_templates`, `list_mcp_resources`,
  `read_mcp_resource`, and `write_stdin`. No connector, browser or payment tool
  was listed. The workspace did not exercise any of those routes.
- The combined probe omitted a check of the directly exposed `apply_patch`
  route. It is outside the two route exceptions. Shell denial alone cannot
  establish how that separate tool enforces the worker filesystem boundary.
  The next bounded check should test that tool with a synthetic outside-file
  canary, compare file identities before and after, and verify that the tool
  returns neither canary contents nor a successful write. If the tool cannot
  be verified or removed, stop.

## Evidence and reuse

The local probe source is `local-evidence/probe-iteration-002-boundary.py`.
From this project's root, `python -B local-evidence/probe-iteration-002-boundary.py`
starts an authorized ChatGPT CLI probe using synthetic files only. It requires
Python 3.12 and the native Codex CLI, uses model allowance, and writes invocation
metadata, canaries and native output to ignored
`local-evidence/iteration-002-boundary/`. It overwrites those outputs if rerun.
Its observed coverage is the PowerShell route and tool names. Keep the original
outputs when using it as a starting point for any separately approved check.

- Probe source SHA-256: `2ad7455977a2a78ed9e4be83e8c925f8a2f8259cb5154cfb1dab723e030e8a7b`
- Invocation SHA-256: `a8b4d8a727d656c5dfd1eed227c1a26977ce13f3370bdb8771f2b279f659b3a8`
- Native events SHA-256: `c57226f127349c4434fb68fffaac28b06524192f916d4f7d17bf6e2cb97e9b6b`
- Native usage: 34,970 input tokens, of which 17,152 cached, and 584 output
  tokens. Actual charges and allowance consumption are unavailable.
