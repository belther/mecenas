# Mecenas

## Purpose and users

Mecenas â€” vocÃª encomenda, o artista recebe. A Brazilian illustration-commission platform for Hack Brasil 2026, Cultura & economia criativa. Clients commission work from independent artists; artists apply without doing free tests. The authoritative product specification is [SPEC.md](../SPEC.md), including R1â€“R11, reputation, identity and the demo plan.

## Scope and constraints

- Follow [AGENTS.md](../AGENTS.md) for hackathon eligibility, privacy, publication, spending and code-provenance requirements. All application code stays in this repository.
- Next.js TypeScript App Router, Convex database/functions/storage/scheduling, and Vercel hosting. Illustration only; retain artType for future extension.
- No chat, music, physical art, cards, boleto, automatic AI detectors or real payments. Use synthetic data only. No real client data.
- Test payments stay in AbacatePay sandbox. The approved fallback keeps the payment in the platform test balance and represents the artist entitlement in the app. Payout is simulated; production custody remains unresolved and needs a licensed escrow provider. See SPEC Â§6.
- No paid operations without Nabo's explicit prior approval. Keep keys in ignored local configuration, never in workflow records or Git. No worker gets production credentials or payment tools.
- Submission deadline: 2026-11-30 23:59 America/Sao_Paulo. Keep the public repository accessible through at least 2026-12-15; follow the repository freeze in AGENTS.md.
- The app must install, build and run without Anvil, its source package, the hub or Nabo's computer. Anvil owns only configuration and development records here.

## Durable decisions

1. Nabo confirmed name, track and stack on 2026-11-20. SPEC.md remains authoritative; these records index it rather than replace it.
2. R1â€“R11 define the intended offer, queue, payment, delivery, revision, review, licence and zero-platform-commission behavior. Do not silently weaken those rules.
3. Day-1 delivery predates Anvil adoption. [Day-1 evidence](../docs/day-1.md) records the foundation, public page, Convex dev/production health checks and sandbox findings. Do not claim it passed independent Anvil review.
4. Live page: https://mecenas-azure.vercel.app . Source: https://github.com/belther/mecenas . Iteration 001's authentication, uploads, profiles and requests were published with Nabo's approval on 2026-11-21. The public workspace is /painel; production registration is closed and production test accounts remain pending. Authenticated flows were verified in development. See docs/deployment-001.md.
5. Sandbox refund testing on 2026-11-20 left R$50 credited to the artist subaccount after a successful full refund. Split-at-payment is unsuitable for the proposed custody design. Assumption of exclusive seller withdrawal control remains unverified. See SPEC Â§6 for exact evidence and limits.
6. Nabo approved the public first demo and first GitHub push on 2026-11-20. Normal hackathon pushes to main are authorized within AGENTS.md. Future deployment scope and any real-money use retain their separate approval boundaries.
7. Nabo authorized adopting the local 0.5.0-hub-dev release through Anvil Start on 2026-11-20. The Anvil and Start fingerprints matched their release manifest before setup. No hub is needed for Start or Iterate. Anvil's lack of a Git repository does not affect Mecenas's Git history; release file fingerprints establish the selected local package identity, not public availability or security isolation.
8. Nabo relayed that new role briefs are planned for 0.6.0. That is future work, not installed functionality or authorization to upgrade this project's pin. Adopt another release only by explicit decision.
9. The [initial presentation script](../docs/video/roteiro-inicial.txt) and [process graphic](../docs/video/fluxo-mecenas.png) are ready. Nabo will record later; the video is not a prerequisite for application development.

## Open decisions and verification limits

- Nabo selected Convex Auth 2.1.0 for synthetic username/password accounts in iteration 001. Production access/public-demo policy remains a separate decision.
- Define fee handling before production; zero platform commission is not a claim that provider fees are zero.
- Full worker isolation remains unverified. Iteration 001 used Nabo's narrowly approved limited exception, frozen initial design, separate adversarial/review roles and two repair rechecks. Read its evidence before another iteration; this is not a standing exception.
- Hack Brasil initial-draft review and final submission are not completed. Initial video is pending.

Provenance: Nabo's launch request, SPEC.md, AGENTS.md, docs/day-1.md and his 2026-11-20 instruction to use the local Anvil Start release. Prepared by Codex on 2026-11-20.
