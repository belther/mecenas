# Production deployment approval — 2026-11-21

Nabo explicitly selected “Publish iteration 001” after clarification between
publication and starting applications/offers. This extends the earlier
development-only approval to the existing public Mecenas demo on Vercel and
its existing production Convex deployment.

Publication policy: registration stays closed by default. No production
username allowlist, real personal data, payment operation or spending is
authorized by this deployment. Existing synthetic development records and
accounts are not copied into production. The public workspace exposes its
sign-in screen; test-account provisioning is a separate next step.

The conductor updates the homepage's obsolete feature notice and adds a link
to /painel. No broad visual redesign is included. The pre-deployment build
passed, Convex's production dry run passed schema validation, and Vercel's
upload manifest excludes .env files, Git metadata and local evidence.

Rollback: restore the previous Vercel deployment for the landing page. Backend
rollback requires deploying the earlier backend source separately; schema/data
compatibility must be checked first. No real payment state depends on this code.

Nabo also asked about Lookbook design skills. Its guidance names Impeccable,
Unslop and Emil Kowalski's skills, but no SKILL.md files were found there. No
skill installation or nonpublic application code was copied from Lookbook.
