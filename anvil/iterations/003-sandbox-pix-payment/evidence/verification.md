# Iteration 003 verification

2026-11-23 (America/Sao_Paulo) · Codex conductor

## Local application verification

- The independent test designer froze 16 cases before implementation. The
  original test files and config identities were preserved. The red harness
  failed its two behavioral assertions for missing payment and funding.
- The root suite passed 41 tests, including eight new Pix tests. They exercise
  ownership, closed and open accepted requests, hashed synthetic CPF claims,
  one active charge, a lost provider response, a failed local write after
  provider success, three-slot exact pricing, a signed synthetic HTTP
  completion, canonical verification, duplicate or concurrent confirmation,
  replacement after expiry and a conflicting later paid charge.
- `npm run typecheck` and `npm run build` passed. The fresh build followed
  a Windows permission failure writing a stale build directory. The Convex
  CLI's standalone typecheck expects a separate configuration this project
  does not have. The normal project-wide typecheck covers the functions.
- The [adversarial review](adversarial.json) and [code review](code-review.json)
  used separate sanitized native packets. Neither worker executed tests.
  The initial reads were truncated. The [targeted recheck](recheck.json)
  covered the central reservation, role projections, event handling and
  funding mutation after the [repairs](review-changes.md). The conductor ran
  the complete runtime suite.

## AbacatePay sandbox probe

One synthetic charge was created for 5000 cents with no split. Create, lookup
by external reference, simulation, and lookup by provider ID each returned
HTTP 200. The provider returned sandbox mode, original amount, and the
application reference in metadata. Its canonical charge moved from pending
to paid. The provider did not supply a separate external-reference or paid
amount value in this probe. Raw IDs, provider bodies and credentials are
excluded. The sanitized probe result is retained in ignored local evidence.

This measured the provider API separately from the application. The local
signed synthetic HTTP test exercises Mecenas's webhook and state transaction
with a mocked provider. The actual provider-to-development-endpoint
notification and funded browser state still require Nabo's sandbox setup.

## Existing development backend and browser

The development functions synced to `successful-fennec-849`. An HTTPS
POST to its new webhook returned 503 without configuration. The desktop
client and narrow-screen artist used separate synthetic sessions. They
published, applied, selected and accepted. With no payment configuration,
the client saw an unavailable message and no QR code. The artist still saw
awaiting payment after reload. The development signup allowlist was restored.
See [browser results](browser-results.json).

Production was outside this run. The sandbox key and test flag existed in the
ignored local file. Development payment variables and registered test webhook
still require the owner setup in the [handoff](../../../../docs/briefs/2026-11-23-iteration-003-handoff.txt).

Local reproduction records include the one-charge contract probe, browser
harness and native canary. They live under ignored `local-evidence/` with their
results. The contract probe uses the existing sandbox key and creates one
synthetic charge per authorized run. The browser harness uses installed Chrome,
Playwright and fresh allowlisted synthetic names. Its recorded scenario
expects the development payment configuration to be absent.
