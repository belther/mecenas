# Local verification and provider status

2026-11-24 · Brasília · The conductor executed the checks. Independent workers inspected restricted snapshots and run evidence.

| Check | Final observation |
| --- | --- |
| Starting suite and behavioral red | 2 Node + 57 Vitest passed on the starting tree. The first new test expected a held delivery and observed automatic approval. |
| Dispute, settlement and reputation tests | 15 focused cases passed. The full suite passed 2 Node + 72 Vitest. TypeScript and the optimized Next.js build passed. |
| Version hold and competing decisions | Before the deadline the flag held the submitted version. At and after the deadline automatic approval won. Competing reviewer decisions produced one outcome. The designated reviewer's own commission was excluded. |
| Money and files | A refused refund stayed pending. After a lost response the canonical refunded charge settled the same case. Replayed notifications and late payment events preserved the outcome. Incorrect amounts, references, provider IDs and payment modes prevented a refund. The client lost read access to old and current files on an upheld ruling. A dismissed ruling granted one simulated release and the approved version. |
| Interruption and overlap | A terminated scheduled attempt recovered through a lookup. A second attempt was denied while a provider POST was paused, even two minutes after the first attempt started. The test observed one POST. |
| Unknown provider response | An interrupted request followed by a stale paid status stayed pending without a second refund POST. When the canonical status changed to refunded, the case settled. An explicit insufficient-balance refusal could be retried. |
| Reputation | Six originally paid commissions, five delivered, one revised, three flagged, one upheld, one dismissed, three approved. Historical approvals counted and repeated revisions contributed once. |
| Desktop and narrow screens | Two Chrome walkthroughs loaded the complete workspace component tree with synthetic preauthenticated sessions at 1280 and 390 pixels. Both participants saw the verdict after reload. The reviewer saw the preview and process images and used the refund retry. Original download bytes matched for the entitled participant. [Browser observations](browser-results.json). |

## External provider check

The five required payment settings were absent on Convex development. The conductor did not create a charge or request an external refund. The actual app-to-provider outcome remains open. The [setup handoff](../../../../docs/briefs/2026-11-23-iteration-003-handoff.txt) and the [payment record](../../../../SPEC.md#6-payments-abacatepay-test-mode) identify the prerequisites. The designated reviewer also needs a separate synthetic auth user ID in the development backend described in the [README](../../../../README.md#human-dispute-review-in-development).

The local provider fixture modeled full refunds of transparent Pix charges, canonical REFUNDED status and signed notifications using the provider's documented contract. [Refunds](https://docs.abacatepay.com/pages/vender/reembolsos) · [Transparent payment events](https://docs.abacatepay.com/pages/webhooks/events/transparent).

The implementation remains in the local working tree. Current source and run identities are in [final source hashes](final-source-hashes.json) and [run hashes](run-hashes.json). The browser harness, snapshots and raw local logs are in the ignored project evidence directory.
