# Art commission platform — spec and 10-day plan

Hack Brasil 2026 · Track: **Cultura & economia criativa** · Deadline: **30 Nov 2026, 23:59 (Brasília)**
Name: **Mecenas** (decided 2026-11-20). Tagline: *você encomenda, o artista recebe*. Status: draft, 2026-11-20.

## 1. The pitch

A free platform where clients commission illustrations from Brazilian artists.
**Artists never work without a paid, accepted offer, and the platform takes nothing from them.**
The client's money is locked before work starts and is released to the artist on approval, or
automatically when the client does not answer in time.

## 2. Problem and people (track fit, item 5.4)

- **Problem:** independent artists in Brazil lose work and money to clients who disappear,
  refuse to pay, or ask for free "tests". Existing contest sites make many artists work for free.
- **People served:** independent illustrators (primary) and the people who commission them.

## 3. Core rules

| # | Rule |
|---|------|
| R1 | **One price rule:** the client sets a price per artist. "Split R$50 among 3" is R$16.67 each; "R$50 each" is R$50 each. |
| R2 | Artists only *apply* to a request ("I will do it"). Nobody draws before an accepted offer. |
| R3 | The client selects artists and keeps a ranked **backup queue**. Each offered artist has 24 elapsed hours to reply. A decline or expiry sends the offer to the next eligible artist with a fresh 24 hours. |
| R4 | An offer is accept / decline. No chat. |
| R5 | Money is paid and locked when the artist accepts. |
| R6 | Every delivery includes a **watermarked preview** and **2–3 process images** (sketch, steps). |
| R7 | The offer includes **2 revisions**. After delivery, the client approves, asks for a revision, or flags AI. |
| R8 | The client has 72 elapsed hours to review each published delivery version. A timely revision stops that clock. Silence at the deadline automatically approves the current eligible version and releases the funded amount to the artist (simulated under §6). |
| R9 | **AI flag:** goes to platform review, not to the client. The full file stays hidden during review. Upheld → client refunded, keeps nothing. Rejected → artist paid. No automatic AI detectors. |
| R10 | On approval: money released, client downloads the full-quality file with a written **licence** (what the client may do with it). |
| R11 | Platform fee to artists: **zero**. |

## 4. Reputation (facts first, blind stars second)

- **Artist:** commissions completed, on-time rate, AI flags upheld against them.
- **Client:** commissions paid, revision/rejection rate, AI flags they raised that were upheld vs rejected.
For the demo, each funded artist offer counts as one paid commission, including later refunds. The client’s revision and rejection rates use distinct paid commissions that reached first delivery. A revision counts once per commission. Rejection means the platform upheld the flag. Show the numerator and denominator, or “Sem histórico” when the denominator is zero. An artist completes a commission when its delivery is approved. Agreed artist delivery dates are not recorded, so the profile shows “Sem prazo de entrega registrado”.

- **Stars (optional):** blind — neither side sees the other's rating until both rated or 7 days pass.

## 5. Identity

- **Artists:** each artist is an AbacatePay **subaccount** with a CPF. AbacatePay returns the
  existing subaccount for a CPF it already knows, and withdrawals go only to the Pix key of that
  CPF. A fake CPF means the artist cannot get paid, so this is real verification at no cost.
- **Clients:** CPF typed at first payment, stored only as a **hash**, used to block a second
  account. It is not bank-verified. This is acceptable because a client must pay before every
  commission, and R8 and R9 protect artists from a bad client.
- **Demo:** synthetic CPFs with a valid format only (item 6.9). No real personal data.

## 6. Payments (AbacatePay, test mode)

Checked in AbacatePay's docs on 2026-11-20:

- ✅ Test mode (sandbox) for Pix, card and webhooks.
- ✅ Subaccounts per seller and **split at payment time**.
- ✅ Subaccount withdrawal by API, only to the subaccount's own CPF Pix key.
- ✅ Full refund by API.
- ❌ No documented **escrow** or "transfer later to a subaccount".
- ❌ No documented way to get the **payer's** CPF from a Pix payment.

**Proposed escrow design:** split to the artist's subaccount at payment; the platform calls
*withdraw* only after approval (R8, R10). **Must verify on day 1 in test mode:** (a) the artist
cannot withdraw by themselves outside our API, (b) a refund reverses the subaccount split.
If either fails: keep the full amount in the platform balance and pay the artist on approval
(simpler, but the platform then holds money — acceptable for the demo, flag it in the pitch as
"production: licensed escrow provider").

### Day-1 verification — 2026-11-20 (America/Sao_Paulo)

Codex read the current official documentation. These are documentation findings,
**not successful sandbox execution**:

| Fact | Result | Evidence / blocker |
|---|---|---|
| (a) Artist cannot withdraw outside our API | **Unverified; sandbox cannot establish this** | Docs describe API-only subaccount creation/split/withdrawal and platform-owned dashboard access, but withdrawals are production-only. A sandbox rejection does not prove exclusive platform control. Provider confirmation and a separate access review remain necessary. |
| (b) Refund reverses subaccount split | **Contradicted by official documentation; runtime test not run** | Docs explicitly state refunds debit the platform balance and the credited subaccount amount stays there. No sandbox account/key supplied, so no balance observations exist yet. |

Sources checked:
- [Subaccounts and split](https://docs.abacatepay.com/pages/dinheiro/subcontas-e-split)
- [Sandbox restrictions](https://docs.abacatepay.com/pages/comecar/modo-teste)
- [Refunds](https://docs.abacatepay.com/pages/vender/reembolsos)

**Decision under the already-approved fallback:** do not build custody on split
at payment time. Keep the test payment in the platform balance; represent the
artist's entitlement in the app and simulate payout after approval/deadline.
AbacatePay does not execute withdrawals/transfers in sandbox, so the demo must
label release as simulated. Production: licensed escrow provider. This preserves
R5/R8/R10 as product behavior, without claiming real escrow or a tested payout.
No live-money action is authorized.

The local probe `scripts/abacatepay-probe.mjs` is experimental. It refuses missing
or production keys before network access, never invokes withdrawal, and can
create/pay/refund one synthetic sandbox split charge with `--execute`. Results
go to ignored `local-evidence/`; summarize reviewed observations here. On
2026-11-20 the probe was run without a key: **blocked before network access**.
Subaccounts also require account-specific enablement by AbacatePay support.
Refund testing may need extra simulated platform balance: split funds remain
separate and transaction fees are not returned. Never substitute real money.

**Fee limitation:** zero platform commission (R11) is distinct from provider
transaction/payout fees. The docs deduct payout fees from the recipient amount.
Who absorbs those fees to preserve the promised artist price needs a decision
before a production design; no fee policy is changed by this verification.

### Sandbox execution follow-up — 2026-11-20, 22:20 Brasília

This updates the earlier missing-account blocker; accounts and sandbox key are
now supplied by Nabo. No real money, withdrawals or transfers were used.

- Subaccount creation, balance read, creation of a synthetic R$100 Pix charge
  with a R$50 split, payment simulation and subsequent balance read all returned
  HTTP 200 with sandbox resources (`devMode=true`).
- The first full-refund request returned HTTP 400 due to insufficient platform
  balance. A separate R$100 simulated Pix payment without split supplied test
  balance. An immediate refund attempt still returned 400; a later explicit
  request succeeded (HTTP 200, `success=true`). No automatic refund retry loop.
- After that successful refund, the artist subaccount still had **5000 cents
  available and 0 blocked**. The R$50 split remained credited. This runtime
  observation agrees with the documented failure of assumption **(b)**.
- The original failed probe report did not retain its initial/pre-refund balance
  values. This is a limitation of that report, not a measured before/after delta.
  The probe now preserves initial and paid balances before requesting a refund.
- Assumption **(a) remains unverified**: withdrawals exist only in production,
  so sandbox does not prove exclusive platform control over seller access.

Reviewed local evidence: `local-evidence/abacatepay-1795223846926.json`,
`local-evidence/refund-check.json`, `local-evidence/refund-funding.json`, and
`local-evidence/refund-completed.json`. These are ignored account/test records;
do not publish raw IDs or keys. The split payment is refunded; the separate
synthetic funding payment remains as test balance. Keep the §6 fallback.

### Iteration 003 sandbox contract — 2026-11-23 (America/Sao_Paulo)

One synthetic, no-split Pix charge for 5000 cents was created in test mode.
The create, lookup by external reference, simulate-payment, and lookup by
provider ID calls all returned HTTP 200. The canonical charge showed
`devMode=true` and transitioned from `PENDING` to `PAID` at 5000 cents.
The lookup returned the app reference in metadata, with no separate
external-reference field and no paid-amount value. The adapter matches the
canonical amount, metadata, sandbox mode and charge ID. This checks the
provider API contract. It does not establish delivery to Mecenas's webhook.

The end-to-end check is pending owner confirmation that the five payment
environment variables are set on Convex development and the AbacatePay v2
`transparent.completed` webhook is registered in test mode. The check must
observe an app-created charge, provider delivery, funded state after reload
for the client and artist, and one funded record after event replay.

Sanitized results are recorded with the [iteration 003 verification](anvil/iterations/003-sandbox-pix-payment/evidence/verification.md).

### Iteration 006 sandbox refund readiness — 2026-11-24 (Brasília)

The conductor checked configuration names on Convex development. Only `MECENAS_DEMO_USERNAMES` was present. The five sandbox payment variables were absent. Delivery of a real provider notification to the app has not been demonstrated. No dedicated iteration 006 charge or provider refund was attempted. The local refund path was tested with synthetic provider responses. The outstanding check requires an app-created, webhook-funded test commission, an independent reviewer's upheld decision and a matching full refund confirmed by AbacatePay. [Development payment setup](docs/briefs/2026-11-23-iteration-003-handoff.txt).

### Payment setup check — 2026-11-25 (Brasília)

The configuration names on Convex development were checked again (names only).
Only `MECENAS_DEMO_USERNAMES` was present; iteration 007 then added
`MECENAS_REVIEWER_USER_ID` for the demo reviewer. The five sandbox payment
variables are still absent, so the provider-webhook check (003) and the approved
dedicated sandbox refund check (006) were not attempted. Iteration 007 demo data
contains **demo payments**: records marked `demo: true`, with no provider charge,
labelled in the app and never sent to AbacatePay. They are not evidence of
any payment, escrow or refund behaviour.

### Webhook and refund checks — 2026-11-26 (Brasília)

Nabo set the five sandbox payment variables on Convex development and registered
the AbacatePay test-mode webhook (v2, `transparent.completed`). Claude checked the
variable names only, never the values. No real money moved.

- **Invalid secret:** a POST to the webhook with a wrong secret returned HTTP 401.
- **Webhook (003):** on seeded commission C, the client generated a test Pix in
  the app (R$ 120,00, synthetic CPF 111.444.777-35). The sandbox
  `simulate-payment` call returned HTTP 200 with `devMode=true`. The provider's
  webhook funded the attempt within 60 seconds; the manual "Verificar pagamento"
  check was not used. Convex recorded one `funded` payment event. After reload,
  the client and the artist both saw "Pagamento de teste confirmado".
- **Refund (006):** the artist delivered, the client flagged AI, and the
  platform reviewer upheld the flag. The app requested the full refund. The
  dispute reached `refunded` within 60 seconds, and the client saw "Reembolso de
  teste confirmado". A separate provider lookup showed the charge as `REFUNDED`,
  12000 cents, `devMode=true`.
- **Not done:** a resend of the same webhook event (duplicate replay). The
  duplicate path is covered by automated tests only.
- Assumption (a) (artist cannot withdraw outside our API) is still unverified,
  and the §6 fallback stays: payout remains simulated.

Sanitized facts and screenshots are in ignored `local-evidence/iteration-009-pix/`
and `local-evidence/iteration-009-refund/`. Afterwards the demo data was reseeded.
The seed kept the tested commission as an ordinary (non-demo) commission because
it holds a real sandbox payment, so the client sees two commissions with C's title.

## 7. Out of scope (hackathon)

Music, physical art, chat, cards/boleto, mobile app, more than one currency, automatic AI detection.

## 8. Demo script (the 3-minute video)

1. Problem in 20 seconds: an artist who did a "test" and was never paid.
2. Client posts a request with examples and R$50 per artist.
3. Two artists apply; client selects one, queues one backup.
4. First artist declines → offer moves to the backup automatically.
5. Artist accepts → client pays Pix (test mode) → money locked.
6. Delivery: watermarked preview + process images. Client asks one revision, then approves.
7. Money released, full file and licence downloaded.
8. 20 seconds: the AI flag and the automatic release on silence. "Artists are always paid."

## 9. Open decisions

1. ~~Product name~~ **Decided: Mecenas.** Brand covers all art forms; the hackathon build is
   illustration only, with an "art type" field so music and physical art can come later.
2. ~~Stack~~ **Decided 2026-11-20: Next.js + Convex, deployed on Vercel.** Convex scheduled
   functions run the deadlines (R3, R8); Convex file storage holds previews and process images.
3. Team: solo, or up to 3 more people (until 30 Nov).

## 10. 10-day build plan

| Day | Date | Work |
|-----|------|------|
| 1 | Fri 21 Nov | New public GitHub repo. Stack set up, deploy a hello-world. AbacatePay test-mode account; verify §6 (a) and (b). Submit the project **draft** in the Hack Brasil panel (credits). |
| 2 | Sat 22 Nov | Data model; auth; artist profile + portfolio upload; client request with example images. |
| 3 | Sun 23 Nov | Apply to request; client selection + backup queue; offers accept/decline (R1–R4). |
| 4 | Mon 24 Nov | Payment: Pix test charge without split (fallback in §6), webhook → app records funds held for the commission (R5). |
| 5 | Tue 25 Nov | Delivery: watermarked preview, process images, revisions, approval, release + full download + licence (R6, R7, R10). |
| 6 | Wed 26 Nov | Deadlines as scheduled jobs: offer timeout → next in queue; silence → auto-release (R3, R8). |
| 7 | Thu 27 Nov | AI flag + admin review screen + refund (R9). Reputation facts on profiles (§4). |
| 8 | Fri 28 Nov | Seed demo data (synthetic). Fix bugs on the full flow. Blind stars only if time. |
| 9 | Sat 29 Nov | Polish UI. Record the video (§8). README with setup, rules and licence. |
| 10 | Sun 30 Nov | Buffer. Submit **before** the evening: name, pitch, description, track, repo, demo, video. Last commit before 23:59. |

After 30 Nov, 23:59: **no commits** until the final (item 8.4). Keep the demo online.
