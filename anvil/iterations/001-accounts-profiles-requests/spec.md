# Iteration 001 — accounts, profiles and requests

Status: draft; not approved for execution
Revision: 0.1
Prepared: 2026-11-20, Codex

## Your decisions

1. Authentication: recommend adopting Convex Auth v2, currently @convex-dev/auth 2.1.0, using synthetic username/password accounts for the hackathon demo. It runs in the existing Convex backend and requires no additional account or email provider. Alternatives: Clerk offers a mature hosted Next.js integration but adds a service account and external user store; Better Auth is flexible and its Convex adapter is maintained, but Convex's current docs recommend their own Auth v2 for new apps. Approving this revision selects Convex Auth. Choosing another option requires a revised specification before execution. No library has been installed yet.

2. Scope approval: approve this usable slice and its verification plan, or identify requested changes. This is approval for implementation and bounded development-backend checks with synthetic records, not approval for a new production deployment, real payments, paid services or an Anvil upgrade. No owner approval is recorded yet.

## Important context

### Outcome

A synthetic client can sign in, describe an illustration request, attach example images and publish it. A synthetic artist can sign in, maintain a profile with portfolio images and browse the published request. Both see their own saved work after reload. This is the foundation for later applications/offers; no work, payment or commission acceptance occurs in this iteration.

Authoritative sources: [SPEC.md](../../../SPEC.md), [AGENTS.md](../../../AGENTS.md), [product](../../product.md), and [roadmap](../../roadmap.md). Existing delivery is documented in [day 1](../../../docs/day-1.md). Preserve the public landing page's current claims until new behavior is verified and deployment is approved.

### In scope

- Sign-in, sign-out and session restoration with an established auth library. Use fictional usernames and synthetic test identities. No email delivery, real social identity, CPF or identity verification. Passwords are hashed by the auth provider and never logged or committed. Demo passwords are generated/configured locally and are not checked into Git.
- One artist or client profile per authenticated identity, created at onboarding. Choose the role once for this slice; a client cannot impersonate an artist by submitting a different role or identity in a mutation. Separate synthetic accounts exercise both roles.
- Artist profile: fictional display name, optional biography, and up to six portfolio images. Ownership checks apply to all writes and file attachments. Publicly visible artist fields do not include login data or internal identity tokens.
- Client request: title, description, illustration artType, price per artist in BRL integer cents, artist slots and up to four reference images. Price must be at least 100 cents, at most 100000000 cents, and a safe integer. Slots must be an integer from 1 through 10. This iteration supports a direct per-artist amount; no shared-budget division or rounding UI.
- Draft and published request states. The owner can save/edit a draft, publish it, and see saved requests. Signed-in artists can browse published requests. Drafts and their image access remain owner-only. Applications, selection and offers belong to iteration 002.
- Image upload accepts JPEG, PNG and WebP, up to 5 MiB each. Reject other formats, oversized images and foreign/unowned storage references. Backend validation must not trust a browser-supplied MIME label or client-only size check. Register ownership before attaching storage to a profile or request; do not use arbitrary storage IDs from the client. Bound image dimensions/decoding and clean up rejected uploaded objects where possible.
- Portuguese interfaces and the existing cream/green Mecenas visual direction. Include useful empty, pending, validation, failure and retry states; do not present failed saves/uploads as successful.

### Acceptance outcomes

- AC1: A valid synthetic account can sign in, refresh the page and remain recognized; sign-out removes actor access. Invalid sign-in gives a useful Portuguese error without exposing credentials or revealing private profile data.
- AC2: Anonymous calls cannot create or change profiles, requests or storage ownership, even by bypassing the UI.
- AC3: An artist can create/update only their own profile and attach valid portfolio images; a second account cannot modify it or reuse its private upload records.
- AC4: A client can save a draft with artType=illustration and a precise per-artist amount, edit it, publish it and retrieve the persisted result after reload. Artist-role accounts cannot create client requests.
- AC5: A signed-in artist can see a published request's approved fields and example images, but cannot see a client's drafts or edit requests. Private identity fields and authentication tables never appear in listing payloads.
- AC6: Invalid amount, title/description, slots, image size/type or file ownership is rejected on the backend with no partial publication or unauthorized attachment. Failed uploads/saves retain enough form state to retry.
- AC7: The owner can attach at most six portfolio or four reference images. Concurrent/repeated saves cannot bypass the limits or create duplicate profiles for an identity.
- AC8: A request remains unavailable to other actors until publication succeeds. Publish validates the persisted fields/attachments atomically; request title 5–120 characters and description 20–3000 characters, trimmed. Profile display name 2–60 and biography at most 1000 characters.
- AC9: npm run build and typecheck pass; meaningful behavioral checks cover allowed flows, anonymous denial, cross-account denial, role denial and unsafe/foreign upload rejection. Browser verification covers one artist and one client with synthetic fixtures.
- AC10: No payment code is invoked, no production credentials are given to workers, no real personal data is used, and no new production deployment is performed under this approval. Existing public page continues to work.

### Failure behavior and exclusions

Unauthenticated requests fail closed. Missing backend configuration shows an actionable unavailable state. Authentication/session errors do not silently create another profile. Mutations derive actor identity from verified server auth, never from a supplied owner ID. Upload validation failure must not attach a file or expose a foreign file URL. State changes and submit controls must handle pending operations and duplicate submissions.

Out of scope: account recovery, email verification, social login, changing account roles, moderation, payments, queue/offer workflows, deadlines, delivery/licences and reputation. All root SPEC rules remain authoritative for later slices. Public unrestricted signup and deployment of the new forms are outside this iteration's approval; public-demo data/access policy will be reviewed before publication.

### Execution prerequisite

This revision is preparation only. The pinned Anvil workflow requires owner approval and demonstrated allowed-packet reads/denied implementation reads before independent initial testing and pilot implementation. Those protections are currently unverified. The plan records a proposed boundary verification step, not evidence that it passed. Do not launch a tester or begin pilot implementation on the strength of a fresh chat, worktree or fingerprint alone. If the actual boundary cannot be verified, report the concrete gap for an owner decision; do not silently weaken the workflow. No process exception is requested or granted in this revision.

## Optional detail

### Authentication research — checked 2026-11-20

Convex Auth: 2.1.0, package metadata updated 2026-11-19; about 780823 npm downloads over 2026-11-13 through 2026-11-19. Its declared peers include Next ^16, React ^18/^19 and Convex ^1.48, compatible with this checkout. Official docs call v2 stable, support Next.js SSR and recommend it for new Convex apps. The auth library is free/open source; normal Convex resource limits still apply. Username/password avoids an email-service setup for the synthetic demo.

Clerk Next.js: 7.10.7, updated 2026-11-20; about 4190470 weekly downloads. Mature documented Convex/Next.js integration, hosted identity management and extra account/configuration. No Clerk account, paid service or real user import is authorized here.

Convex Better Auth adapter: 0.13.1, updated 2026-11-20; about 481832 weekly downloads. Official Better Auth docs identify the adapter as Convex-maintained. Flexible, but extra integration work and not Convex's currently recommended starting point. Download counts indicate package activity, not unique users or security guarantees.

Sources:
- https://docs.convex.dev/auth/convex-auth
- https://docs.convex.dev/auth/convex-auth/getting-started
- https://docs.convex.dev/auth/convex-auth/methods/username-password
- https://docs.convex.dev/auth/clerk
- https://www.better-auth.com/docs/integrations/convex
- https://www.npmjs.com/package/@convex-dev/auth
- https://www.npmjs.com/package/@clerk/nextjs
- https://www.npmjs.com/package/@convex-dev/better-auth
- https://api.npmjs.org/downloads/point/last-week/%40convex-dev%2Fauth
- https://api.npmjs.org/downloads/point/last-week/%40clerk%2Fnextjs
- https://api.npmjs.org/downloads/point/last-week/%40convex-dev%2Fbetter-auth

### Proposed interfaces

Auth core owns user/session state. Application profile identity is derived from authenticated server context and indexed uniquely by that identity. Request records reference a client profile and hold validated cents/slots/status/storage links. An upload record binds storage ID to authenticated owner, purpose, validated type/size and attachment state. Profile and request functions check role, ownership, field limits and file ownership on every write. Listing queries return explicit safe projections. Existing tables contain only synthetic data; inspect schema compatibility before changing validators, and do not delete records automatically to force a deploy.

## Provenance

Nabo requested day-2 development in the launch instructions on 2026-11-20; SPEC §10 defines auth, artist profile/portfolio and client requests. Nabo authorized local Anvil 0.5.0 adoption and continuation of iteration 001 on 2026-11-20. Root hackathon/data/spending boundaries are hard requirements. Authentication choice and the numeric/file limits in this revision are Codex recommendations pending this revision's approval, not previously approved product rules. Preparation does not certify isolated testing or implementation completion.
