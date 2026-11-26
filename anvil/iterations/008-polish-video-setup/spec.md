# Iteration 008 — interface polish, video script and setup documentation

Revision 0.1, 2026-11-25 (Brasília). SPEC §10 day 9.

## Goal

Make the seeded demo look finished on desktop and narrow screens, give Nabo a
script for the 3-minute video (SPEC §8), and let a judge run the project from
the README alone.

## Scope

1. The platform reviewer sees only the review workspace (approval decision 1).
2. "Histórico de cliente" / "Histórico de artista" gets its own styled block, with
   space between it and the content below.
3. A visual pass of `/painel` at 1280 px and 390 px over commissions A–F, with
   fixes for what it finds.
4. README: a short judge quick start (install, Convex development, demo seed,
   reviewer ID, `.env.demo`) and an up-to-date current state. The README keeps
   the statement that AI agents and Anvil are the development workflow and are
   not part of the app.
5. `docs/video/roteiro-final.txt`: Portuguese script and shot list for SPEC §8,
   mapped to the seeded commissions and accounts.

## Acceptance criteria

- AC1 Signed in as `demo-revisor`, `/painel` shows "Revisão da plataforma" and no request form, client history or "Editar perfil". Other accounts are unchanged.
- AC2 The history summary has visible space above the next section at both widths.
- AC3 Walkthrough at 1280 px and 390 px over all five accounts: no page errors, no horizontal overflow, findings and fixes recorded.
- AC4 A person who follows only the README quick start reaches the seeded demo.
- AC5 The video script covers all eight SPEC §8 steps within about 3 minutes and labels the demo payment as simulated.
- AC6 `npm test`, `npm run typecheck` and `npm run build` pass.

## Out of scope

Schema changes, deployment, production seeding, real payments, recording the video.
