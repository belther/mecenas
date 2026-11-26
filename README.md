# Mecenas

**Você encomenda, o artista recebe.** Illustration commissions for Hack Brasil
2026, Cultura & economia criativa. MIT licensed.

Built with AI agents and Anvil, the author's development workflow. **Anvil is
not part of the app** and is not required to install, run, test or deploy it.
If present, `anvil.yaml` and `anvil/` contain development records only.

## Current state

Iteration 001 adds a Portuguese workspace at `/painel`: synthetic account sign-in,
artist/client profiles, validated portfolio/reference images, private request
drafts, publication and artist browsing. It was verified locally against the
**development** Convex deployment, then published with Nabo's approval on
2026-11-21: https://mecenas-azure.vercel.app/painel . Production health, public
page access and anonymous-denial checks pass. Registration is closed. One private
synthetic production login was verified on 2026-11-24. See the original
[release evidence](docs/deployment-001.md). The working tree also contains offers,
test payments, versioned deliveries, deadlines, human dispute review and reputation.
The public site still serves iteration 001.
Without a Convex URL the page explicitly shows local demo mode.
First public page: https://mecenas-azure.vercel.app (verified 2026-11-20).
Convex dev and production health queries are connected. The sandbox probe
confirmed that refunding a split payment leaves the artist's split credited.
Read [SPEC.md](SPEC.md) for product rules and [AGENTS.md](AGENTS.md) for boundaries.

## Run locally

Node.js 22 or newer (tested on 24), npm, and a free Convex account for backend.
From the repository root:

```powershell
npm install
Copy-Item -LiteralPath ".env.example" -Destination ".env.local"
npm run dev
```

Open http://localhost:3000. The initial page builds without credentials.
Nabo must create accounts and enter keys himself. Never send keys in chat.
All `.env*` files are ignored except the empty `.env.example` template.

In another terminal, connect the development backend:

```powershell
npm run convex:dev
```

Nabo signs in and creates/selects Mecenas in Convex. The CLI writes the dev
deployment settings to `.env.local` and generates `convex/_generated/`.
Restart Next.js after environment changes. The footer reports connected only
when the deployed `health:check` query answers. No private data is exposed.

### Synthetic workspace accounts

Open http://localhost:3000/painel after the development backend is ready.
Registration is closed by default. In the Convex **development** dashboard,
Settings → Environment Variables, configure `MECENAS_DEMO_USERNAMES` with a
comma-separated list of fictional usernames approved for your local test.
The current development verification uses `cliente-demo` and `artista-demo`;
test passwords are not saved. For your own run, configure fresh fictional names
and create those accounts in the local workspace with unique passwords generated
locally. No passwords are supplied or committed. An allowed username can enroll
once; this is a limited synthetic demo, not a production invitation system.
Do not enable production registration without a separate access-policy review.

Choose artist or client once when saving a profile; roles cannot change.
Artists can then edit their profile to add up to six portfolio images. Clients
can save a request with up to four references, then publish it for artists.
Save all edits before publication. Prices are BRL **per artist**, stored as
integer cents, from R$1.00 to R$1,000,000.00. No payment is initiated.

Images are decoded server-side, limited to JPEG/PNG/WebP, 5 MiB and 20 million
pixels, rotated/resized to at most 2560 pixels and stored as metadata-free WebP.
Ownership and purpose are checked before attachment. Unattached valid uploads
remain in development storage; automatic orphan collection is future work.
Storage URLs are bearer links: draft queries and preview lookup are owner-only,
but someone who receives a URL can read it. Use synthetic images exclusively.

Auth uses Convex Auth 2.1.0, HttpOnly refresh cookies and verified live sessions.
The guarded signup adapter uses a narrow, tested runtime handler compatibility
seam; auth is pinned and upgrades require rechecking signup/session tests.
Account recovery, identity verification and real public registration are absent.

See [iteration evidence](anvil/iterations/001-accounts-profiles-requests/evidence/index.md)
for checks, independent review findings, repairs and verification limits.

```powershell
npm test
npm run typecheck
npm run build
```

### Human dispute review in development

Designate a separate synthetic account. In the Convex development dashboard, copy
that account's immutable `users` row ID into Settings → Environment Variables →
`MECENAS_REVIEWER_USER_ID`. Sign in as that account at `/painel` to see
**Revisão da plataforma**. Accounts involved in a commission cannot decide it.

The client can choose **Contestar uso de IA** before a funded version's review
deadline. The platform reviewer examines its preview and process images and records
a decision. An upheld case stays pending until the original sandbox Pix charge is
confirmed refunded. **Verificar reembolso** checks that charge again. If the
provider explicitly refuses for insufficient sandbox balance, a reviewer can
retry after the balance is available. After an uncertain submission, the app
only checks for confirmation. If the charge stays paid, the operator must
reconcile the request with AbacatePay before any further provider-side action. A dismissed
case unlocks the approved original and licence and records a simulated release.
For provider verification, use the [development payment setup](docs/briefs/2026-11-23-iteration-003-handoff.txt)
and a sandbox key with refund permission. The app also accepts the signed
`transparent.refunded` event on its existing development webhook.

## Vercel + Convex production

### Current deployment (manual, without GitHub integration)

Nabo authorized a public first demo. The project runs on Vercel Hobby in team
`vamo-ve`; no GitHub connection is installed. Production Convex:
`https://peaceful-salmon-164.convex.cloud`. Development Convex:
`https://successful-fennec-849.convex.cloud`.

The first page was deployed with the Vercel CLI, with only the public production
Convex URL set in Vercel. Backend code was deployed separately from this checkout
using Nabo's locally supplied Convex token. Both remote `health:check` queries
returned `status: ok`; the public page shows `Convex conectado`.

For this manual workflow, deploy backend changes with `npx convex deploy` before
deploying frontend source with the Vercel CLI. Authenticate through the local
service tooling or CLI login; never put tokens in command arguments. Vercel uses
the standard Next.js build. `.vercelignore` excludes environment files, local
evidence/tooling, Git metadata and local build artifacts. Keep those exclusions.
API tokens stay in ignored `.env.local`, not in the Vercel application runtime.

The production deploy-key workflow below is an alternative for future automatic
GitHub deployments; it has not been configured. Nabo approved the first public
GitHub push on 2026-11-20; normal hackathon pushes to main are now authorized
within AGENTS.md's boundaries.

### Optional GitHub-connected workflow

Use Vercel **Hobby** for this personal, noncommercial sandbox demo and Convex
**Free**, without paid upgrades or pay-as-you-go activation. No custom domain,
paid plan or usage charge is authorized. Recheck limits before changing scope.

1. Nabo creates accounts at https://vercel.com/signup and https://dashboard.convex.dev.
2. Obtain Nabo's first-push approval before publishing to public `belther/mecenas`.
3. In Convex, create the production deployment. Deployment Settings → General →
   Generate Production Deploy Key; grant only needed deployment permission.
4. Vercel → Add New → Project → import `belther/mecenas`, root directory `.`,
   framework Next.js. Build command: `npm run deploy:build`.
5. In Vercel Environment Variables, Nabo enters `CONVEX_DEPLOY_KEY` scoped to
   Production only. Never commit it. Convex deploy supplies NEXT_PUBLIC_CONVEX_URL.
6. Deploy, open the returned URL, and confirm `Convex conectado` in the footer.
   Record the URL and actual verification in `docs/day-1.md`.

The initial plain `npm run build` permits a backend-free hello-world. Production
must use `deploy:build` to deploy the backend and build against its URL together.
Do not mark production connected merely because a URL exists.
To undo this first deployment, remove the Vercel deployment/project; remove the
Convex deployment separately if desired. No payment records depend on it yet.

Official setup: https://docs.convex.dev/quickstart/nextjs and
https://docs.convex.dev/production/hosting/vercel.
Free plan references checked 2026-11-20: https://vercel.com/docs/plans/hobby and
https://www.convex.dev/pricing. AbacatePay sandbox uses no real money:
https://docs.abacatepay.com/pages/comecar/modo-teste.

## AbacatePay sandbox probe (experimental)

Purpose: measure subaccount balances before payment, after a split payment, and
after its refund. Fact (a), exclusive seller withdrawal control, remains
unprovable in sandbox because withdrawals are production-only. Fact (b) is
documented as false: refunds leave the split credited. See SPEC §6.

Nabo creates an AbacatePay account, enables **Modo Teste (Sandbox)** in the
dashboard, and asks support to enable subaccounts if needed. Create a sandbox
key with `SUB_ACCOUNT:CREATE`, `SUB_ACCOUNT:READ`, `TRANSPARENT:CREATE`, and
`REFUND:CREATE`. Enter `ABACATEPAY_API_KEY=abc_dev_...` and
`ABACATEPAY_TEST_MODE=true` in ignored `.env.local`. No withdrawal permission.

From the repository root:

```powershell
npm run payments:probe
npm run payments:probe -- --execute
```

First command is a dry run. Execution creates a provider-example synthetic
artist, a simulated R$100 Pix charge with R$50 split, simulates payment and
requests a full refund. It never calls withdrawal or transfer. Sandbox refunds
may require additional simulated platform balance because fees do not return
and the split remains in the subaccount. Use a dedicated sandbox without other
balance activity. Each execution creates a new charge; do not rerun blindly
after a timeout. Inspect the saved sandbox IDs in the dashboard first.

Output: ignored `local-evidence/abacatepay-<timestamp>.json`, with sanitized
observations and recovery IDs, never raw responses or keys. Review it and add a
dated summary to SPEC §6. An unchanged split is an observed failure of (b), not
a failure of the probe. Immediate unexpected deltas are inconclusive; check
settlement later. No local test proves real payment behavior or licensed escrow.

All money release in the hackathon fallback must be labelled simulation.
Production needs a licensed escrow provider and separate approval.

Execution checked 2026-11-20: split payment simulation succeeded; refund initially
failed because platform funds were insufficient. After separate simulated
funding and settlement, the full refund succeeded while R$50 stayed credited to
the subaccount. Details and evidence limitations are recorded in SPEC §6.

## Source provenance

App code is written for this repository during the hackathon. Dependencies:
https://github.com/vercel/next.js, https://github.com/facebook/react,
https://github.com/get-convex/convex-js, https://github.com/microsoft/TypeScript,
and https://github.com/DefinitelyTyped/DefinitelyTyped.
Introducing commits must name these sources. No private Anvil code is copied.
