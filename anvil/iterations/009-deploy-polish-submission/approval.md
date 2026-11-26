# Owner approval

Nabo's decisions in chat, 2026-11-26 (Brasília):

1. **Deploy current main to production** as the first step (decided before this session).
2. **Standing approval** to redeploy main to production after each tested change, until the freeze. ("yes, continue" to the numbered list.)
3. **Seed A–F on production** behind an explicit production flag, and set `MECENAS_REVIEWER_USER_ID` on production.
4. **Payments on production stay off.** Commission C shows a note instead of an error (option a). No payment variables or webhook on production.
5. **Video location:** decide later; the default is localhost against development, which keeps the real sandbox Pix.
6. **Tidy development data** before the video (stale open requests, duplicate C title).
7. **Anvil record level:** as in 008 — spec, approval, verification, one independent review.
8. **Design changes:** D1, D2, D3 and D5 ("Do 1, 2, 3, 5"). D4 and D6 not chosen. D7 (stale demo state) follows the recommendation: Claude reseeds production on 29–30 Nov; Nabo reseeds before judging on 12 Dec.
9. **Judge password** never goes in the repository; Nabo gives it only in the submission form.
10. Nabo asked for the full test pass ("Do the testing, to see if everything is alright").

Submission editing after sending: Nabo checks in the Hack Brasil panel.
