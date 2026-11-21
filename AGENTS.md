# Mecenas project instructions

Requested by Ricardo Nabo on 2026-11-20 for Hack Brasil 2026. All rules below
are hard requirements unless explicitly labelled otherwise. Read SPEC.md first;
its product decisions and rules R1–R11 are authoritative until Nabo changes them.
Shared instructions apply to all coding agents; no Anvil dependency is required.

## Hackathon boundaries

- Write all Mecenas application code in this repository from now on. Never copy
  nonpublic code written before 2026-11-04 at 21:00 Brasília. Public open-source
  dependencies or copied code require source links in the introducing commit.
  Reason: regulation 6.1, 6.2 and 12.2 can disqualify imported private code.
- Never place Mecenas logic in Anvil or another outside folder.
  Reason: regulation 6.1 requires all event-developed code in the submitted repository.
- After every Anvil setup/change, inspect git status and confirm it introduced
  only anvil.yaml and anvil/ records, with no package templates or private code.
  Reason: copying private Anvil implementation would violate regulation 6.2.
- Keep standard setup working: npm install, npm run dev, npm run build, and
  documented Convex setup. Never require Anvil or Nabo's machine.
  Reason: regulation 6.6 requires judges to read, run and test the project.
- Use synthetic data only, including format-valid synthetic CPFs. Payments must
  remain in test mode. Do not access real client data or process real money.
  Reason: Nabo's stricter demo boundary implements regulation 6.9.
- Make no commits after 2026-11-30 23:59 America/Sao_Paulo until the final on
  2026-12-12; check the date before committing, and ask before resuming on final day.
  Reason: regulation 8.4 freezes repository changes through the final.
- Keep this repository public and accessible at least through 2026-12-15.
  Reason: regulation 6.7 makes continued public access an eligibility condition.
- README must disclose AI agents and Anvil as the author's development workflow,
  and state that Anvil is not part of the application.
  Reason: judges need to understand anvil/ records and development provenance.

Source: https://hackbrasil.com/regulamento (checked 2026-11-20).

## Product and operations

- Use Next.js TypeScript App Router, Convex and Vercel. Keep artType in the data
  model; implement illustration only. No chat, cards, boleto, music, physical art
  or automatic AI detection. Reason: these are Nabo's settled hackathon scope.
- Treat payment custody and refund claims as unverified until evidenced. Follow
  SPEC §6's fallback when either split assumption fails. Never call a simulation
  real escrow. Reason: artists' money protection is the central product promise.
- Nabo creates service accounts and enters keys himself. Keep all .env* files
  ignored, except a blank .env.example; never commit credentials or tokens.
  Reason: the public repository must not expose service access.
- Confirm free plans before account setup. Obtain explicit approval before any
  action that incurs real charges. Reason: Nabo has not authorized spending.
- Ask before the first GitHub push. Once Nabo approves it, normal hackathon
  pushes to main are authorized within these boundaries.
  Reason: the first push publishes to a public destination.
- Obtain approval before deployment unless the specific deployment is already
  authorized. Day-1 hello-world deployment is authorized by Nabo's launch request.
  Reason: publication must remain within the requested scope.
- Inspect changes made by another session before editing the same file.
  Reason: shared work must not overwrite concurrent edits.

## Verification

Run npm run build and appropriate focused checks. Record dated payment evidence
and exact blockers in SPEC §6. Report deployment and connection status honestly.
Reason: local scaffolding is not proof of a working production integration.
