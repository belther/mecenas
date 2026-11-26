# Iteration 003 boundary check

2026-11-23 (America/Sao_Paulo) · Codex

The combined native canary and tool inventory completed in 30.62 seconds using
ChatGPT login and a minimal environment. The restricted worker read its packet.
Both outside reads and the outside shell write reported access denied. The
worker reported standalone Add File rejected by read-only policy and Update
File unable to read the outside canary. The conductor checked that both synthetic
write targets stayed absent and the outside canary hash stayed unchanged.

The inventory exposed collaboration and generic resource routes covered by the
iteration-specific exception. No additional unresolved tool routes appeared.
Worker command networking was disabled by configuration. No account or
credential was in the packet. Full isolation remains unverified.

The raw native events are retained in ignored
`local-evidence/iteration-003-boundary/events.jsonl`. SHA-256
`66d26462be99f690c5449195725d79c438302040c6a3355eae8089fbeb0fdff1`.
Usage was 71,539 input tokens including 53,120 cached, and 914 output tokens.
Actual charges and allowance consumption are unavailable.
