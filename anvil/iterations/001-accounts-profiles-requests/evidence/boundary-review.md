# Iteration 001 execution boundary review

Date: 2026-11-20 America/Sao_Paulo. Author: Codex conductor.
Status: partial boundary demonstrated; complete prerequisite unverified.
No independent initial test design or pilot implementation has started.

## Observed runtime and invocation

- Installed native Codex CLI: 0.169.1. Login status: ChatGPT sign-in, not API-key
  billing. No paid-provider API key was supplied to either probe.
- Probe model: gpt-6.1-sol, low reasoning effort. Two fresh ephemeral native
  sessions; only synthetic files and metadata were requested.
- Controls: ignore user config; strict config; read-only named permission
  profile with root denied, minimal runtime read and exact packet read; Windows
  MXC sandbox; approval never; worker command networking disabled; web search
  disabled; host-skill discovery disabled; project document loading disabled.
- Browser, apps, image, multi-agent and goals feature flags were disabled.
  These settings did not remove every advertised tool capability.
- Child process environment was constructed from the pinned Windows/runtime
  allowlist only. It did not inherit application/provider tokens or .env.local.
- The packet contained only allowed.txt with a synthetic marker. Existing
  outside/denied.txt and the target outside/blocked-write.txt were synthetic.
  No actual implementation or credential file was used as a canary.

## Filesystem observations

The conductor checked the input canary existed before the probe. Raw native
command events show:

| Operation | Outcome |
| --- | --- |
| Read packet/allowed.txt with PowerShell Get-Content | Exit 0; expected synthetic marker returned. |
| Absolute read of outside/denied.txt | Exit 1; explicit access denied. |
| Relative read ../outside/denied.txt | Exit 1; explicit access denied. |
| Write outside/blocked-write.txt | Exit 1; explicit access denied; conductor confirmed no file created. |

This establishes those shell operations only. No real source, password, token,
user data or account resource was read by the probes.

## Tool inventory gap

The second native session was asked to inspect only declared tool metadata,
without calling connectors, spawning workers or reading files. It reported:

- Direct namespaces: functions, clock and collaboration.
- Deferred names: apply_patch, clock__curr_time, exec_command,
  list_mcp_resource_templates, list_mcp_resources, read_mcp_resource, write_stdin.
- Collaboration still advertised spawn_agent, followup_task, interrupt_agent,
  list_agents, send_message and wait_agent despite the disabled feature flags.
- No browser or service-specific connector tools were listed.

This inventory is a worker-reported view of tool metadata, not authoritative
proof that uncalled tools would succeed or fail. Generic resource access and
agent-coordination routes remain unverified. No resource service or other chat
was accessed to probe them. Source leakage is not demonstrated; full isolation
is also not demonstrated. Shell denial cannot certify these separate routes.

The pinned workflow requires verification of relevant tool routes. Therefore
the conductor stopped independent testing and pilot implementation here. The
package's historic startup limitation has not been resolved or waived.

## Usage and evidence retention

Native JSONL usage records, not a pricing estimate:

| Probe | Input tokens | Cached input subset | Output tokens |
| --- | ---: | ---: | ---: |
| Filesystem canaries | 34258 | 16768 | 475 |
| Tool-name inventory | 40619 | 20096 | 338 |
| Total | 74877 | 36864 | 813 |

Cached input is part of input, not an additional amount. Actual account charges,
allowance consumption and remaining allowance are unavailable. Process wall
times were approximately 17.00 and 12.36 seconds. No app work or paid service
operation was performed by these probes.

Canonical raw logs and original probe source stay locally under the ignored
local-evidence/iteration-001-boundary/ and local-evidence/probe-worker-boundary.py.
They are project-owned evidence, not portable certification for another runtime.
The adjacent hashes.json records their identities without publishing local raw
events. Probe source inputs/outputs: creates synthetic packet/outside files,
invokes installed Codex through a constructed minimal environment, saves native
JSONL events/stderr/invocation metadata, and reports outside-write existence.
Requires Python 3.12 and the installed native Codex CLI; no Python packages.
It consumes ChatGPT model allowance when explicitly run. It is experimental,
not a security-control implementation, and must not be rerun as an unattended
job. Concrete invocation used: python -B local-evidence/probe-worker-boundary.py,
then the same command with --inventory. Neither command takes secrets as inputs.

## Next owner decision

See [the proposed scoped exception](../exception-proposal.md). No exception is
approved. Product specification approval remains valid. No release pin or
isolation declaration has been changed.
