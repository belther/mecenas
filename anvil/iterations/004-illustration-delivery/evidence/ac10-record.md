# Anvil AC10 live use

2026-11-23 (America/Sao_Paulo) · Mecenas iteration 004 · Codex

Anvil 0.6.0-briefs-dev generated the [code-reviewer brief](brief-code-reviewer/brief.md)
from the [request](brief-request.json). Mecenas kept its 0.5.0-hub-dev pin.
The native reviewer used `gpt-6.1-sol`. Login status reported `Logged in using
ChatGPT`, and the launch excluded API-key variables.

- [brief.json](brief-code-reviewer/brief.json) SHA-256
  `9f24a2df9a59f47d13a8dc84c7881db4b64819ee809d75ac9476390bbe318ebf`.
- The candidate `brief.py check` on that record exited 0 and printed
  `{"status": "unchanged"}` after the review.
- The reviewer wrote [report.md](code-review-brief/report.md) in its allowed
  output folder. Its status line was `Status: BLOCKED — missing baseline files
  prevent the required test comparison.` The conductor copied the report into
  this project without edits.
- No edits were made to `brief.md`. A preflight generation was superseded
  after screenshot fixes, before reviewer launch. The only sentence added to
  the conductor's message beyond the context requested in step 3 was:

  > The workspace is a restricted copy. Resolve the listed paths from the current directory.

## Finding and follow-up

The brief listed the baseline manifest as one input. The reviewer's comparison
required the files referenced by that manifest. The restricted packet supplied
the manifest and two matching files. Nine referenced files were absent. The
reviewer inspected the complete diff, scope, claims and frozen delivery test,
then stopped at the missing comparison. It raised no other unclear, wrong or
missing brief content.

The conductor supplied the exact baseline files in a separate restricted
follow-up. The [independent recheck](baseline-recheck.json) matched all 11
starting files and the frozen new test. The product review had no concrete
findings, and the missing comparison is complete. The original AC10 status
remains recorded above. There was one live run using the generated brief.

Raw reviewer events SHA-256
`5723d1b5dbfc2c0b965facd22ccb871e294ad737536716930936efbb0f0e1378`.
Usage was 262,829 input tokens, including 222,848 cached, and 2,523 output
tokens. The targeted recheck used 63,279 input tokens, including 41,984 cached,
and 801 output tokens. Actual charges and allowance consumption are unavailable.
