# Native startup check, 2026-11-24

The conductor ran one 39.69-second synthetic probe with the pinned Windows runtime on subscription sign-in. The fresh worker could read its packet. Relative and absolute reads outside it failed. A shell write and standalone patch attempts against an existing and absent target also failed. After exit, the outside canary retained SHA-256 `bf40641398d716760aaf9291c721757782005cca152a50a027130b4f98e38618` and neither new target existed.

The worker environment omitted provider keys. Command network access was disabled and runtime approval set to never. The reported collaboration and generic resource tools were subject to the [iteration-specific exception](../approval.md). Their enforcement remains unverified. The role instructions prohibited using them. No other unresolved route was identified.

Local invocation, events and error output are under `local-evidence/iteration-005-boundary/`.
