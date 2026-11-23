# Iteration 002 — applications, selection and offers

Status — draft for Nabo's review  
Revision 0.1 · 2026-11-22 · Codex

## Your decisions

1. Approve the product specification and development verification plan for revision 0.1, or request changes. Recommended behavior: the client can send offers for fewer than the available slots and can rank backups once every slot is reserved. The owner can update the remaining queue while responses come in. A decline sends the next offer automatically. Acceptance reserves the slot and tells the artist to wait for payment confirmation. All accepted slots close new applications. The verification plan limits development to synthetic accounts and records.
2. Choose the execution path for iteration 002. Recommend a new, iteration-specific reduced-assurance authorization under the [execution plan](plan.md), subject to fresh synthetic checks. This preserves the filesystem controls, packet limits and independent roles while accepting the explicitly unverified collaboration and generic resource routes. Alternatively, keep the full isolation prerequisite and pause implementation until those routes are independently bounded. Approval of decision 1 alone leaves this gate open.

## Important context

### Outcome

An artist applies to a published illustration request with a single action. The owning client reviews the artist's existing portfolio, chooses recipients within the slot limit and ranks backups. Selected artists can accept or decline in the workspace. A decline gives the same slot to the highest-ranked eligible backup immediately, or leaves it available when the queue is empty.

### Applications and visibility

- A signed-in artist with a profile can apply once per published request that is still accepting applications. Applying records intent only. There is no upload, message, sketch or new portfolio requirement.
- The request owner sees applicants' display names, optional bios, existing portfolio previews and review states. Artists see only their own application and offer history, with no ranking, applicant roster or other artist responses. The public workspace reveals neither state. A response acknowledges only the recipient's own offer and never identifies a promoted backup. Role and ownership checks run in Convex for every operation. Private drafts stay owner-only.
- Applications stay open while any slot is vacant or awaiting a response. They close when every slot has an accepted offer. The artist can still see their own history. The underlying published request remains compatible with iteration 001 records.

### Selection and queue

- The client reviews applicants in the published request view and prepares a set of offers and an ordered backup list. One explicit save sends offers and saves the queue together. Show the count and the effect before saving.
- A pending offer or accepted offer reserves exactly one slot. Clients may send fewer offers than the available slots. When saving a nonempty backup queue, the selections and existing reservations must account for every slot. This gives “backup” a clear meaning and prevents a new selection from passing an already ranked artist.
- Candidates must belong to the same request, be distinct, and have no previous offer on that request. An applicant cannot appear in both the new selection and the queue. The owner may reorder, add or remove remaining eligible backups. Existing offers retain their terms and recipient. Declined artists cannot be reoffered within this iteration.
- Use one request-wide queue with an explicit order across all slots. Decline consumes the first eligible backup and reserves the freed slot for that artist. If there is no eligible backup, the owner sees a vacancy and can select another applicant. When all slots are accepted, the remaining backup list has no further effect in this slice.
- A saved selection must use the current selection revision. If another tab saves or an artist responds first, the client sees a refresh message and must review the new state before resubmitting. Incoming applications alone do not invalidate selections made from the previous roster.

### Offer transitions

- Available → awaiting response. Saving a valid selection creates one pending offer per selected slot. The offer shows the stored BRL amount por artista. Copy that exact integer-cent amount onto the offer. No budget splitting or rounding.
- Awaiting response → accepted, awaiting payment. Only the recipient can accept. Acceptance keeps the slot reserved. Show the artist “Oferta aceita. Aguarde a confirmação do pagamento para começar.” Show the client “Oferta aceita · aguardando pagamento” with a brief note that payments arrive in a later demo stage. There is no start-work, checkout or delivery action.
- Awaiting response → declined. Only the recipient can decline. Mark the original offer declined and promote the first eligible backup into the same slot in one Convex mutation. The promoted offer starts at awaiting response with identical pricing. A failed mutation leaves both the decline and promotion unapplied.
- Awaiting response → declined with no eligible backup. Record the decline and leave the slot available in the same mutation. The original offer remains visible as declined.
- Accept and decline are final in this slice. Repeating the same response returns its existing outcome without side effects. A conflicting response reports the saved state. With simultaneous responses, only the first committed response changes the offer. Simultaneous declines across slots consume distinct backups in transaction commit order.

### Payment and deadlines

In iteration 003, the accepted offer is the reference for the client's sandbox Pix payment. The artist can start only after the server verifies the payment and records funds as held for that specific offer at its agreed amount, following SPEC §6. Acceptance records consent and never changes payment status to funded. Iteration 005 adds scheduled expiry for unanswered offers and uses the same atomic slot-release and promotion behavior. There is no expiry timer or scheduled work in 002. The slice has no chat, delivery, payment simulation, notifications outside the workspace or changes to production.

### Interface

- Keep the cream workspace, dark green actions, Georgia headings and existing request cards. Put the per-artist price alongside the decision. Give portfolio thumbnails room in the client review and use the existing portfolio. Keep rank numbers functional and the rest of the interface quiet.
- The client sees filled slots, remaining capacity, and the ordered “Fila de reserva”. On desktop, show applicants beside the selection summary. Stack the summary and queue below applicants on mobile. Use named “Subir” and “Descer” controls with the artist name in their accessible labels. Keep keyboard focus on the moved artist, or move it to an available control in that row at a boundary. Announce the new rank.
- The artist sees “Candidatar-se”, “Candidatura enviada”, then any offer in “Minhas candidaturas”. Offer actions are “Aceitar oferta” and “Recusar oferta”. Put the payment condition beside acceptance. Confirm decline with its effect before submitting. Preserve focus on the result when actions disappear.
- Show local pending feedback and prevent double submission while a request is in flight. Keep a failed selection editable and distinguish it from stale state that needs review. Use text status, visible focus, accessible status announcements, and explicit image dimensions. Keep reordering immediate. Any brief pointer feedback respects reduced-motion preferences.

### Acceptance checks

- A1 — Roles and privacy. Anonymous callers and users without a profile cannot apply, review or respond. Artists cannot select. Clients cannot apply or answer. A second client cannot read or change another client's applicant list or queue. Artists cannot read or answer another artist's offer. Existing draft privacy survives.
- A2 — Apply once. An artist can apply to a request published in 001 with an empty portfolio. The first, repeated and concurrent application calls leave one record. A draft or a fully accepted request rejects a new application. Reload preserves the artist's own status.
- A3 — Capacity and terms. Exercise requests with one and multiple slots. Confirm partial selection, the maximum slot count, rejection of overflow, duplicate, foreign and previously offered applicants, and the rule for saving backups. A R$50,00 offer on a three-slot request stays R$50,00 per artist through selection, promotion and acceptance.
- A4 — Ranked promotion. For a request with two pending offers and at least two ranked backups, change the order and decline both offers concurrently. Verify the saved order is consumed once, each replacement occupies precisely the released slot, and no read can observe a committed decline without its replacement when an eligible backup exists. Also cover queue exhaustion, a stale queue revision and refresh.
- A5 — Responses and retries. Exercise repeated accept, repeated decline, and accept racing decline. Verify only the first response commits, same-answer retries keep the outcome, and retries never consume another backup. Race owner saves against responses and test rollback on failure around promotion.
- A6 — Payment boundary. Verify the accepted state persists across reload for both roles with payment pending. Verify that no work, checkout, payout, delivery or scheduled expiry is triggered or advertised as available.
- A7 — Usability and regressions. Exercise development sessions for two clients and multiple artists at desktop and narrow widths. Cover portfolio review, ranking by keyboard, decline confirmation, empty/pending/error feedback, refresh and the original profile, draft, publish and browse paths. Run the test suite, typecheck and optimized build. Record actual results and limitations.

## Optional detail

Proposed implementation contract, subject to routine refinement within approved behavior. Keep existing requests usable without a backfill. Index applications by request and artist and support owner review by request. Give each offer a stable identity and a slot number scoped to its request. Keep pending and accepted offers active, declined offers as history, and the ordered backup list and revision in request-scoped state. Allocate or release seats and consume the queue in Convex mutation transactions. Project role-specific fields and return public-safe portfolio previews only after access checks. Keep offer and request identifiers in useful workspace navigation where supported; authorize any deep link on the server.

## Provenance

Nabo requested the slice on 2026-11-22. [SPEC.md](../../../SPEC.md) governs R1–R4, the payment fallback and the later deadline iteration. Prior implementation and access limits are recorded in the [iteration 001 evidence](../001-accounts-profiles-requests/evidence/index.md) and [deployment notes](../../../docs/deployment-001.md). The reviewed base is main at `0444af4`, with [Nabo's handoff brief](../../../docs/briefs/2026-11-22-iteration-002.txt) already present as an uncommitted file. The detailed queue, closure and selection rules above are Codex proposals awaiting Nabo's review.
