# Corrections for the independent recheck

The original code reviewer identified a potential overlap between a slow provider action and a second authorized retry. The original behavioral assessment also requested explicit race orders and interrupted-run coverage.

The case now stores the Convex scheduled function ID in the same transaction as its refund attempt. A retry transaction reads that system row and declines to schedule a new provider call while the original job is pending or in progress, regardless of elapsed time. The run number also prevents stale completion from replacing the newer result. A synthetic test pauses the provider POST after the first paid lookup, advances the clock two minutes, attempts another retry and observes exactly one POST. A separate interrupted-run test records the previous job as terminated and recovers using a read-only canonical lookup. The refund still depends on the external provider honoring one full refund per charge. The real sandbox check remains blocked as documented in the accompanying extract from the project SPEC §6.

The final tests explicitly run both deadline orderings, and approval and revision winning before the flag. Both Chromium walkthroughs mount the actual /painel page, account header, participant workspace, applicant selection, artist browser, reviewer queue and profile history. Local adapters supply navigation and already authenticated synthetic Convex identities. Browser sign-in, Vercel hosting and an external refund are outside these walkthroughs.

Final results: 2 Node + 72 Vitest tests, 15 focused tests, 2 complete workspace walkthroughs, standalone typecheck and optimized build passed. The original reports remain preserved.

## Second corrections submitted for recheck

The first recheck confirmed local serialization and observed that AbacatePay might still be processing a request after the scheduled action ends. The action now records its intent immediately before the refund POST. A timeout, unknown response or lost confirmation leaves the reservation in place. Subsequent attempts read the charge's canonical status without another POST. AbacatePay's documented insufficient-balance refusal allows a retry after funding the test balance.

The new regression path observes a lost response followed by a stale paid status. No additional POST occurs before the provider fixture confirms the refund. If confirmation never arrives, the case remains pending for operator reconciliation. The development payment configuration still blocks the provider check.
