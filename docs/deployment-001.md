# Iteration 001 public release — 2026-11-21

Nabo explicitly selected “Publish iteration 001”. Approval is recorded in
anvil/iterations/001-accounts-profiles-requests/deployment-approval.md.

- Published source commit: f9f0ab0 (iteration implementation: 7faa342).
- Public page: https://mecenas-azure.vercel.app .
- Public workspace: https://mecenas-azure.vercel.app/painel .
- Vercel deployment: dpl_HRCL7JMNViFY6p6mDwa7ZY8bwKhr, READY, verified about
  20:37 America/Sao_Paulo; both existing project aliases assigned.
- Existing Vercel team remains Hobby, using the plan-default basic build machine.
- Production Convex: peaceful-salmon-164; auth/password/username components,
  profile/upload/request functions and schema deployed successfully.
- Local optimized build passed after adding the homepage's workspace link and
  correcting its obsolete feature notice. Application behavior tests are the
  21 passing checks recorded in the iteration evidence.
- Vercel upload dry run excluded .env files, Git metadata, local evidence,
  node_modules and local build artifacts. No application token was uploaded.
- Browser verified anonymous homepage access, the link to /painel, the hydrated
  sign-in form and “Convex conectado”. No Vercel login barrier appeared.
- HTTP homepage/workspace responses are 200. Production health returns ok,
  anonymous authentication returns false and anonymous profile returns null.
- The production username allowlist is absent. Unapproved synthetic signup
  attempts were rejected. No production test accounts or development records
  were provisioned/copied. No payment function was invoked.

Access limitation: this publishes the workspace, but it is not yet a signed-in
public demo. Production test accounts and their access/distribution policy are
the next setup step. Valid authentication, profile persistence, uploads and
publication were exercised against development; they are not claimed as an
authenticated production verification.

The initial HTTP probe incorrectly expected hydrated sign-in text in raw HTML;
the browser established that state, and the corrected HTTP/backend probe passed.
Raw release status, smoke results and screenshot remain in ignored local-evidence.

Rollback: promote the preceding Vercel landing deployment
dpl_8bkGremL2knUHEG9fqQCDvFCE9HJ. Backend rollback is a separate deploy and must
first check schema/data compatibility. No real payment state is involved.
