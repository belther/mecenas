# Code review — iteration 004-illustration-delivery

Status: BLOCKED

Reviewer: Codex, 2026-11-23. Read-only review; no network, workers, attacks, product edits, or test execution.

## Exact stopping point

The required comparison against the frozen baseline cannot be completed in this restricted packet. `evidence/test-baseline.json` lists files absent from the packet: `package-lock.json`, `scripts/abacatepay-probe.mjs`, `scripts/abacatepay-probe.test.mjs`, `scripts/render-video-graphic.mjs`, `tests/applications.test.ts`, `tests/backend.test.ts`, `tests/images-money.test.ts`, `tests/payments.test.ts`, and `tsconfig.json`. Paths here are relative to the packet; the baseline is at `anvil/iterations/004-illustration-delivery/evidence/test-baseline.json`.

These omissions are not evidence that implementation deleted the files. They prevent verification that starting tests and assertions remain intact. Stop at the baseline-comparison step; do not treat this report as review approval.

## Specification check completed before the stop

Read the specification, approval, plan, coder report, complete diff, delivery tests, and relevant supplied source. The specification hash matches the approved SHA-256 `d5108aef0c2aaa0fa904facdf24bf1c819a618bef0b2a80db451def95199d680`. The supplied diff hash matches `cce3ff17767aab1d3be380d283275b6d212b4938970674d3f57d686c9fe7c3c7`.

The inspected implementation follows the specified slice: funded participant checks, two or three process files, a separate original and watermarked derivative, version-specific review, two revision requests, one transactional simulated release, and client-only access to the approved original. No concrete product defect was established before the stop. This is a partial assessment, not a completed finding-free review.

## Findings

1. **Blocking review evidence gap:** baseline artifacts listed above are unavailable. Supply their final versions within the permitted packet so their hashes and contents can be compared against the baseline. Evidence: baseline `files` entries and failed literal-path reads/hash checks. This severity applies to review completeness, not to a proven product regression.

## Coder claims checked

| Claim | Result and evidence |
| --- | --- |
| Accepted, funded offers have participant-scoped delivery | Supported by inspection of `convex/lib/delivery.ts:9` and its use in queries, mutations, and file authorization. |
| Uploads are tied to offer, artist, and expected version; incomplete submissions preserve state | Supported by `convex/deliveries.ts:32` and `convex/lib/delivery.ts:36`. Validation precedes transactional publication. Actual platform write-outage behavior was not exercised. |
| Unused staging files expire after 24 hours | Scheduling and unused-file guard present in `convex/deliveryFileRecords.ts:16`. Runtime scheduler execution not independently verified. |
| Validated original is stored separately from reduced, visibly watermarked preview | Supported by `convex/deliveryFiles.ts:20` and `lib/image-validation.ts:18`; original bytes are stored unchanged after preview validation, process images are normalized. |
| Review images are participant-only; approved original is client-only; public responses omit storage URLs and identifiers | Supported by `convex/deliveryFileRecords.ts:34`, `convex/deliveries.ts:9`, and `convex/deliveryFiles.ts:43`. No attack was run. Upload returns a staging-record ID to the submitting artist, not a storage identifier. |
| Approval and revision name the version; approval saves a single BRL release with the amount and licence | Supported by `convex/deliveries.ts:61` and `:77`; state checks and release insertion share a mutation. Approved replay returns without another insertion. |
| Licence is fixed at first submission and displayed before delivery/approval; separate downloads exist | Supported by `convex/deliveries.ts:57`, `lib/delivery-licence.ts:1`, and `app/painel/deliveries.tsx` form, review, and download components. |
| Starting and frozen tests unchanged; no discovery change | Partially verified as detailed below. Missing baseline files prevent a full conclusion. |
| Red run, four passing delivery tests, 2 Node and 43 Vitest tests, typecheck, optimized build | Conductor supplied these results in the brief. Not independently rerun; the packet lacks required suite/configuration artifacts. |
| Desktop/narrow walkthrough, reload persistence, matching original download, licence download, and layout fixes | UI support is present in source. Historical browser results and screenshot-driven fixes remain conductor-reported; screenshots and transport harness were not supplied as review inputs. |
| No provider call, external configuration change, or production deployment; hosted transport/Pix webhook excluded | Diff scope is consistent with these claims. Historical execution and external state cannot be independently established from the supplied source. |

## Test-change review

`package.json` and `vitest.config.ts` match their baseline hashes. Discovery includes `tests/**/*.test.ts`, which includes the new suite. The complete diff changes neither discovery configuration nor existing tests and adds only `tests/deliveries.test.ts` in the test area. The delivery test hash exactly matches the supplied frozen hash `56e5ca643b766d99360234875d555d1db516bacd564c8175bcc5539c2a15ad3e`. No skip was seen in that suite.

The four new cases meaningfully cover funded eligibility, private review, invalid/incomplete/cross-offer uploads, two revisions, stale requests, approved-original bytes, exact 5000-cent release, and competing transitions. The preview assertion checks reduction and pixel variation rather than directly recognizing watermark text; source inspection supplies the complementary evidence that a visible watermark is composed. Full baseline assertion/deletion review remains blocked. No test-change reasons were needed for the supplied unchanged-test claim, but that claim is not fully verified.

## Questions for the owner/conductor

1. Supply the missing baseline artifacts in the restricted packet, or provide a complete reviewable final snapshot containing them. No scope expansion, external account access, or owner product decision is needed to resolve this evidence gap.

No additional consequential product choice was established in the inspected source. The fixed licence and simulated-release scope have recorded owner approval.
