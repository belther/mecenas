# Iteration 006 retrospective

The client can flag the current funded delivery before its review deadline. The platform reviewer can dismiss the flag or uphold it and request a full sandbox refund. Commission history counts distinct artist offers. The local suite, two browser walkthroughs, typecheck and optimized build passed.

The initial review exposed two different retry risks. An in-progress scheduler job now prevents another job from submitting a refund while the first one runs. If the provider outcome is uncertain after that job exits, the recorded submission keeps retries in lookup-only mode. An explicit refusal for insufficient test balance clears the submission so the reviewer can retry. If the provider never confirms an uncertain request, the case stays pending for operator reconciliation.

The live sandbox check remains pending. The development deployment lacks the five payment settings, and AbacatePay delivery to Mecenas still needs verification. The next test should follow one paid synthetic commission through the reviewer decision and confirm the matching refund in both systems. [Local verification](evidence/verification.md) · [Payment setup](../../../docs/briefs/2026-11-23-iteration-003-handoff.txt)
