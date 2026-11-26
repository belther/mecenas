# Iteration 004 implementation report

2026-11-23 (America/Sao_Paulo) · Codex conductor

- Accepted, funded offers now have private delivery and review. An upload is
  tied to the current draft, offer and artist. Incomplete uploads leave the
  existing version available. Unused staging files expire after 24 hours.
- The app stores the validated original separately and renders a smaller,
  visibly watermarked preview. Both participants can load review images. Only
  the owning client can read the original of the approved version. Public
  responses contain no storage URLs or private storage identifiers.
- Revision requests and approval name the reviewed version. Approval commits
  the approved version and a single simulated BRL release for the saved amount
  together. The licence is fixed when the delivery is first submitted. The UI
  shows the terms and offers the approved client separate original and licence
  downloads.
- The conductor ran the starting suite (2 Node and 39 Vitest tests) and the
  focused red check. It reached the actual funded payment view and failed at
  the expected delivery-eligibility assertion. The current source passed four
  delivery tests, the full `npm test` suite (2 Node and 43 Vitest tests),
  typecheck and the optimized `npm run build`. No starting test or discovery
  configuration was modified. The frozen delivery test is unchanged.
- The 1280-pixel client and 390-pixel artist browser walkthrough used the actual
  workspace delivery components and Convex test backend over a loopback test
  transport. It verified two revisions, approval of version 3, persistent
  state after both reloads, an original download matching the uploaded bytes,
  and a written licence download. Browser and screenshot checks led to fixes
  for duplicate React keys and desktop process-image caption placement.
  The anonymous local Convex CLI could not fetch
  its backend binary. The fixture covers the delivery UI and transaction, with
  auth sessions supplied by the harness. Hosted Convex transport and the actual
  Pix webhook remain outside this run.
- No payment provider call, external configuration change, or production
  deployment took place. Backend tests did not inject a platform write outage.
