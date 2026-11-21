# Mecenas

**Você encomenda, o artista recebe.** Illustration commissions for Hack Brasil
2026, Cultura & economia criativa. MIT licensed.

Built with AI agents and Anvil, the author's development workflow. **Anvil is
not part of the app** and is not required to install, run, test or deploy it.
If present, `anvil.yaml` and `anvil/` contain development records only.

## Current state

Day 1: Portuguese landing page, Next.js TypeScript App Router, Convex health
query and initial day-2 schema. No account, commission or payment UI yet.
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

```powershell
npm test
npm run typecheck
npm run build
```

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
