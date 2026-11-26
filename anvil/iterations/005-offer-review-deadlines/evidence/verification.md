# Local verification, 2026-11-24 (Brasília)

## Starting state and red run

The conductor preserved the effective source tree and the 12 starting test and configuration file identities, including the local changes from prior iterations. The starting suite passed 45 tests. The independent designer returned 13 behavioral cases before the first application edit. The red run then failed three new assertions on the missing 24-hour offer and 72-hour review deadlines. The [implementation report](coder-report.md) explains the clock fixture adjustment.

## Final results

| Check | Observed result |
| --- | --- |
| `npm test` | 2 Node tests and 57 Vitest tests passed. |
| `npm run typecheck` and `npm run build` | Both passed. The final test-only additions also passed standalone typecheck. |
| Focused offer and review suite filtered with `-t 005` | 19 passed. This includes existing cases matched by the filter. |
| Local Chrome with Convex test backend | Two walkthroughs passed at 1280 and 390 pixels, using actual workspace components, synthetic sessions and a Tokyo browser time zone. [Detailed observations](browser-results.json). |
| Interrupted and concurrent initialization | Both 35-record tests passed. A cancelled continuation restarted safely. A second migration automatically paged past an ineligible record while a client requested a revision. |
| Repeated jobs and competing actions | One automatic release for the funded version, no revision consumed for a late request, no duplicate promotion, correct slot counts, and no release for mismatched or unverified funding. |
| Review access | Both participants saw the saved reason after reload. The client downloaded original version 3 with matching bytes and the personal-use licence. |

The conductor executed the commands against the local source. Reviewers inspected the supplied snapshots, hashes and execution evidence. Raw synthetic logs, the effective baseline archive and the browser harness are under the ignored `local-evidence/` directory. [Run identities](run-hashes.json) and [final source identities](final-source-hashes.json) identify the verification inputs and outputs.

Hosted rollout remains pending separate approval. After backend deployment, hourly initialization begins for eligible records with missing deadlines. New records schedule immediately. Approval and release are simulated. A held/disputed state will first exist in iteration 006. Only the explicit review state currently qualifies for automatic release.
