# Proposed execution exception — iteration 001 only

Status: proposed; not approved. Revision: 0.1.
Prepared by Codex on 2026-11-20 for Nabo's decision after the boundary probes.
This supplements, and does not replace, the approved product specification.

## Decision

1. Recommended if Nabo wants to continue the hackathon slice now: allow the
   independent initial tester to use the demonstrated native shell boundary
   plus instruction-based restrictions on the still-advertised collaboration
   and generic resource tools. Accept that complete route isolation is
   unverified. No sandbox control is removed or weakened by this proposal.
2. Alternatively, keep the full prerequisite: pause implementation while a
   separately scoped Anvil/runtime task verifies or removes those remaining
   tool routes. A future Anvil version is not presumed to solve this gap.

## Exact smaller scope and limits for option 1

- Applies only to Mecenas iteration 001, specification revision 0.1 SHA-256
  e22b4f2d6130bf2e9904ba4ade10663c27c0be84adc27625d75ad9311d1a57e8.
- Initial tester receives only the approved specification, test interfaces and
  synthetic fixtures in a fresh packet, without implementation-bearing chat,
  source code, Git objects, keys, .env files or account sessions.
- Retain the demonstrated root-deny / packet-read native MXC permissions,
  minimal environment, disabled command networking and approval policy never.
- The worker is explicitly prohibited from invoking collaboration, generic MCP
  resource tools, browsers, connectors or other source-retrieval routes. This
  is an instruction for those extra tools, not enforced absence or a verified
  all-route access boundary. That is the accepted risk if option 1 is approved.
- Freeze returned initial test design before conductor implementation. Preserve
  hashes and later source-exposure decisions. Initial tests cannot be described
  as fully isolated, regardless of passing canary results.
- Later adversarial and code-review roles remain separate fresh sessions, with
  explicitly permitted sanitized source access and no application credentials.
  Their independence is process/role separation, not a claim of blind access.
- Conductor alone runs dev-backend operations with locally supplied credentials.
  No production deployment, real payments, spending or app secrets to workers.
- One adversarial pass, one separate code review and at most two combined
  repair/recheck cycles remain the pinned pilot limit. Stop and report any
  observed unexpected source/resource access or credential exposure.
- Does not modify Anvil, install 0.6.0, waive another project prerequisite,
  authorize unrelated workers or create a standing exception for later slices.

## Residual risk

A worker might use an unverified advertised tool route despite its instructions.
That could compromise blind test design or retrieve material outside the packet.
No such access was observed in the probes. The conductor must not represent
instructions, feature flags or fresh sessions as complete enforced isolation.

Owner approval must explicitly select option 1 before any execution under it.
General approval of the product specification did not approve this exception.
