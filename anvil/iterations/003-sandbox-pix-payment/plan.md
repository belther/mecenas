# Iteration 003 execution plan

Status — proposed · Revision 0.1 · 2026-11-23 · Codex

## Slice and interfaces

1. Record approval of the exact specification revision and SHA-256 and separately record the iteration 003 execution path. Approved scope may include the existing development HTTPS endpoint and a test-mode provider webhook only. Keep Vercel production, production accounts and live payment settings outside this slice.
2. Preserve existing test contents and identities, freeze an independent spec-only test design, and record meaningful red behavior before changes. Keep provider access behind server functions so the independent workers can use synthetic stubs, inspect sanitized source and run focused checks without credentials.
3. Add a server-owned payment-attempt ledger and sandbox adapter. Make the attempt reservation and final funding transaction atomic in Convex. Provider I/O occurs outside mutations. Enforce client ownership before charge creation or retrieval. Route webhook and authenticated client reconciliation to the same internal verification and state change.
4. Extend both workspace views. Run the full suite and focused checks, typecheck and optimized build. With the owner's sandbox setup, observe one provider Pix simulation through actual HTTP delivery on existing Convex development. Record the observed outcomes and limits in the iteration evidence and add dated payment evidence to SPEC §6. Conduct distinct adversarial testing and independent review. Keep the raw provider bodies and credentials out of the records.

## Risks and meaningful verification

- AbacatePay v2 documents transparent Pix creation, listing by charge ID or external reference, status checking and sandbox simulation. The create reference does not document an idempotency guarantee for the external ID. Treat it as a lookup key and confirm the actual sandbox retrieval fields, creation ambiguity behavior and supported amount range before relying on them. The status check alone does not establish all matching fields.
- Verify the registered webhook secret in constant time and verify AbacatePay's HMAC signature over the raw body before parsing. The published HMAC key is separate from the private webhook secret. Confirm sandbox mode, stored charge identity, exact amount and paid status against the provider. If the pruned provider response cannot establish a required fact, leave funding pending. Accept extra envelope fields without retaining them. Test duplicated event IDs and a resend with a new ID.
- Require an explicit test-mode configuration and sandbox key format before any provider request. Reject a non-sandbox provider response before displaying a QR. Verify transient failure, loss between provider creation and local persistence, duplicate creation attempts, and concurrent notifications.
- Verify that application closure and payment-owner access compose correctly. Use test fixtures and sanitized projections. Nabo supplies only the necessary secrets directly to development configuration. The conductor alone uses them and may verify a test payment. Review workers receive no keys, provider tools, live event bodies, account sessions or raw CPF input.
- Record exact test/build commands, source identities, release status and sanitized end-to-end evidence. Check the Brasília freeze before any commit.

## Provider references checked on 2026-11-23

- [Transparent Pix creation](https://docs.abacatepay.com/pages/transparents/create), [charge lookup and filters](https://docs.abacatepay.com/pages/transparents/list), [status check](https://docs.abacatepay.com/pages/transparents/check), and [sandbox simulation](https://docs.abacatepay.com/pages/transparents/simulate-payment).
- [Webhook events and retry handling](https://docs.abacatepay.com/pages/notificacoes/webhooks), [webhook secret and signature](https://docs.abacatepay.com/pages/notificacoes/seguranca), and the [transparent completion event](https://docs.abacatepay.com/pages/webhooks/events/transparent).
- Documentation review only. No sandbox charge, secret configuration, endpoint deployment or webhook registration was performed during preparation.

## Isolation prerequisite

Keep Anvil 0.5.0-hub-dev and its existing fingerprint. The project declares full isolation unverified. The iteration 002 shell and standalone patch evidence guides preparation but cannot establish the new worker boundary. Its exception applies only to that iteration.

Under a new owner-approved exception, verify one bounded synthetic startup and tool inventory in the actual worker setup. Test an allowed packet read, denied absolute and relative outside reads, denied outside shell write and both standalone patch operations against existing and absent outside canaries. Inspect observed output, compare canary file identities and check that no outside file appeared. Confirm fresh context, disabled worker command network, approval policy never, minimal environment and ChatGPT login without an API billing key. The exception covers collaboration and generic resource tools only. Prohibit their use, exclude browser, provider and service connector access, and stop if a required protection fails or another tool route is unresolved. Keep the independent blind designer separate from the implementer and later sanitized-source roles.

## Checkpoint and limits

Allow one combined synthetic boundary check and up to 30 minutes of setup after approval. Report a concrete blocker without rebuilding the workflow. Use the pinned limit of one adversarial pass, one separate review, and at most two combined repair/recheck cycles. Check in at 45 minutes of implementation or earlier for a material blocker. Keep the existing free stack and request separate approval for anything chargeable.

## Test driven development exceptions

No exception is proposed. An unavailable worker test runner may produce independent cases for conductor execution. Label each runtime result with who actually ran it.
