# Iteration 001 verification — 2026-11-21

Technical delivery is local/development only. Owner acceptance and production
publication remain separate. The approved specification and rendered review are
historical, fingerprinted documents; their original draft wording is superseded
by approval.md and exception-approval.md, not edited after approval.

## Behavioral evidence

- Independent initial designer: fresh native Codex session, requested model
  gpt-6.1-sol, medium reasoning; 22 cases frozen before implementation.
- Callable no-op baseline: three expected assertion failures for persistence,
  anonymous-write denial and publication visibility. These establish missing
  contract behavior, not a claim that real application tests ran before source
  existed. Raw output: ignored local-evidence/iteration-001-red.log.
- npm test: two pre-existing payment-probe safety tests and 19 Vitest tests pass.
  No payment network operation is invoked by these tests.
- Backend tests use real Convex Auth signup/password/session component functions
  with a synthetic issuer and injected verified-session identities. The WASM
  loader compiles the real bundled password module; hashing is not mocked.
- Checks cover revoked sessions and refresh, wrong passwords, anonymous denial,
  immutable roles, one profile under concurrent initial saves, ownership,
  private drafts, publication, exact cents, text/slot limits, image limits,
  duplicate/foreign attachments and malformed persisted image links.
- Image tests decode JPEG/PNG/WebP, verify resize and metadata removal, reject
  fake/mislabeled/oversized/excessive-pixel files, and exercise the full upload
  action and protected preview lookup with synthetic images.
- npm run typecheck passes. First optimized build passed. A later build hit a
  Windows EPERM directory lock while the dev preview was running; final build
  passed after stopping that preview (2026-11-21, about 20:15 Brasília).
- Convex dev --once succeeded against successful-fennec-849. Production backend
  peaceful-salmon-164 and Vercel were not deployed in this iteration.

## Browser evidence — actual development service

Synthetic client signup and profile save, draft creation/edit, R$50.51 per artist
for two artists, reference upload, save, publication and persistence after reload
were exercised. Unsaved changes disable publication; invalid R$0.50 input keeps
all entered text, gives a Portuguese error and succeeds after correction.
Sign-out returns to the sign-in interface. An incorrect artist password produced a Portuguese failure; a retry with the correct generated password succeeded. Synthetic artist signup, profile,
published request/reference browsing and portfolio upload/save were exercised; both the artist session and portfolio persisted after reload.
Desktop width 1400 and narrow width 390 were inspected. Images and names are
synthetic. Screenshots remain ignored local-evidence/iteration-001-*.jpg.
Browser commands used CUA, not raw browser/CDP scripts. A stalled first chooser
attempt was recovered with the documented filechooser API.

## Review, repairs and limits

Distinct fresh native adversarial and code-review sessions received explicitly
permitted sanitized source after initial design froze. No service keys, .env,
Git objects, production account access or parent implementation history were
provided. Their command tools retained root-deny permissions and denied network.
No prohibited tool use was observed in event logs. Full all-route isolation is
**unverified** under Nabo's narrowly approved iteration-only exception.

The initial sanitized Windows packet accidentally gave root SPEC.md and iteration
spec.md colliding case-insensitive names. Later rechecks use ROOT-SPEC.md and
spec.md separately. Review workers could inspect source but could not execute
Node tests: Windows denied an ancestor lstat on C:\ before test loading.
Those attempts are blocked execution, not passing or failing behavior evidence.
The conductor executed tests separately in the authorized working directory.

Initial findings: restrict registration; validate persisted upload/storage
correspondence at publish; prevent publication overlapping unsaved edits; expand
reference/concurrency/exact-value tests. All were repaired. Recheck 1 found the
reverse race (editing during publication); lifted pending publication now locks
the full editor. Recheck 2 reported no remaining findings and confirmed repairs
by source inspection. This used both allowed repair/recheck cycles.

Registration is closed unless MECENAS_DEMO_USERNAMES lists an exact fictional
username. Current dev verification names are cliente-demo and artista-demo;
passwords were random in runtime memory and were not committed or retained.
This limits enrollment but is not a secret invitation mechanism. A separate
public-demo access decision is required before production publication.

## Test/configuration changes

Starting test identities are in test-baseline.json. Initial design JSON remains
byte-for-byte frozen. Its abstract cases were implemented in conductor-authored
integration tests; independent authorship of executable tests is not claimed.
The starting baseline used direct SHA-256 hashing rather than the pinned snapshot helper and retained hashes, not a full original-content snapshot;
therefore reviewers could establish changed identities but could not independently
prove every original assertion was preserved. This limits the audit.

Changes after baseline: synthetic issuer configuration; real WASM loader for
Node; typed Convex storage reads return ArrayBuffer rather than unsupported Blob;
refresh and full-action image tests; registration-denial, reference limits,
concurrent first-save and malformed-publication regressions. Exact persisted
amount assertions replaced a weaker record-count check. No tests were deleted,
skipped, marked todo, or removed from discovery; test thresholds were not reduced.
Package test discovery expanded from scripts/*.test.mjs to also tests/**/*.test.ts.
The final test/configuration identities were also captured with the pinned snapshot helper in final-test-snapshot.json. TypeScript permits dependency .ts imports and Vite's import.meta.glob declarations.

## Remaining verification limits

No production deployment or production auth integration is proven. Network-loss
and server-failure recovery states are implemented but were not exhaustively
fault-injected in a browser. Missing-config handling is source-reviewed; no
second unconfigured browser server was launched. Windows/sandbox review workers
could not run tests independently. Convex-test concurrency is not a substitute
for a live load test. Rejected bytes are never stored; valid unattached images
remain in dev storage until future cleanup. Storage URLs are shareable bearer
links after an authorized lookup. No production privacy or escrow claim is made.

The root-deny exception, source identities and actual native token usage are
separate evidence. Token records are not account charges or measured allowance
consumption; no actual charge amount is available.

Vault capture is unavailable under this workspace's write boundary. Durable
project decisions, code and evidence are retained here; no vault write is claimed.
