# Iteration 002 development verification

2026-11-23 (America/Sao_Paulo) · Codex conductor

## Test evidence

- The starting suite passed 21 tests. The original test contents are preserved
  in ignored local evidence and all [starting file identities](test-baseline.json)
  still match the working tree. The separate native designer returned 20
  behavioral cases, [frozen before implementation](initial-design-freeze.json).
- The [callable red harness](red-baseline.test.mjs) exited 1 before
  implementation. Its two assertions failed for missing application
  persistence and missing same-slot backup promotion. Neither failure was
  an import or startup error.
- The final application suite has 33 passing tests, including 12 additions
  in [applications.test.ts](../../../../tests/applications.test.ts). It checks
  role and ownership boundaries, old published requests, deduplication,
  closed applications, exact price, capacity up to ten slots, idempotent
  responses, stale selections and both owner/artist commit orders. Fault
  injection covers a failed promotion insert and the second insert in a
  selection, plus an outer rollback after a nested promotion. Tests check
  unchanged state and consistent retries, including direct checks for offer
  rows outside the owner projection. No payment or expiry action runs.
- `npm run build` and `npm run typecheck` passed. The test run emitted Vite's
  existing warning about a future config loader change.
- The in-memory Convex harness serializes top-level transactions. The
  development service was separately exercised with concurrent authenticated
  requests. Two duplicate apply calls returned one application. Two declines
  produced distinct replacements in the freed slots. The subscription saw
  revisions 1, 2 and 3. It observed the first-ranked replacement in the slot
  released at revision 2, with both slots reserved at every observed revision.
  Competing accept/decline calls returned a single saved result and advanced
  the revision once. The check did not measure internal conflict retry counts.

## Browser and interface review

The final check used Chrome 157 with Playwright 1.65.1, a local Next.js
development server, and the existing Convex development backend. Two clients
and five artists used separate synthetic sessions at desktop (1280 × 920)
and narrow mobile (390 × 844) widths. The flow covered draft privacy,
publication, portfolio upload and client review, a denied cross-client link,
one-click application, ranking by keyboard, stale save recovery, decline
confirmation, automatic promotion, acceptance and reload persistence.
Accepted artists saw the payment wait message. The temporary signup allowlist
was restored. Synthetic accounts and test requests remain in development.
[Recorded browser results](browser-results.json).

The local design skills guided the workspace extension and changed-source
review. Checked cream and green styling on desktop and narrow screenshots,
visible focus, button and link semantics, accessible rank controls, status
announcements, image dimensions, touch targets and reduced-motion handling.
The repairs were checked at the interface:

- `app/painel/page.tsx:34` · Warn before leaving a dirty selection. Dismissing
  the warning keeps the draft. The browser clicked “Editar perfil,” dismissed
  its confirmation and checked that the queue stayed in place. Sign-out uses
  the same guard and was checked by source inspection.
- `app/painel/applications.tsx:34` · Focus the new candidacy status after a
  successful keyboard submission.
- `app/painel/applications.tsx:287` · Keep focus with the moved artist and
  announce the updated rank. The browser checked the announcement text and
  focus target. No standalone assistive-technology session was run. Skip-link
  focus and preserving focus when another session applies were reviewed in
  source and were outside the final browser scenario.

## Independent verification limits

The [adversarial trace](adversarial-initial.json) read sanitized source and
found no confirmed defect. Its attempt to execute Vitest failed at Node's
ancestor-path permission check, so the conductor ran all runtime tests.
The [separate code review](code-review-initial.json) identified four issues
in navigation, keyboard focus and verification coverage. The
[repairs](review-changes.md) record the changes. The first repair recheck
timed out after 240 seconds. A [narrower recheck](final-review-recheck.json)
confirmed the repairs by source inspection and asked for more precise
browser reporting and direct rollback assertions. The conductor recorded
the exact browser coverage and added direct offer-row checks to the tests.

This verification covers the working tree identified by the
[final source manifest](final-source-manifest.json). Production remains on
iteration 001. Production test accounts and authenticated production
verification remain pending. See the [iteration 001 release record](../../../../docs/deployment-001.md).

## Local reproduction records

The original test output, synthetic screenshots, browser script and runner
results are retained under ignored `local-evidence/`. The archived review
packets are kept as ZIP files alongside their native logs. The versioned
source manifests identify what each reviewer was given.

- `node local-evidence/iteration-002-convex-dev.mjs dev --once --typecheck disable --tail-logs disable`
  syncs only the existing named development backend. It requires the installed
  Convex CLI and the existing local management credential. It redacts that
  credential and the deployment key from output.
- `node local-evidence/iteration-002-browser.mjs` is the final historical browser
  harness. It starts a temporary loopback server and Chrome, uses Playwright
  and a locally allowlisted batch of fresh synthetic usernames, and writes
  screenshots and JSON results. Its usernames have been used. A rerun requires
  a fresh synthetic batch and separate development allowlist cleanup.
