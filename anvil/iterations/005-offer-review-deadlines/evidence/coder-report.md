# Deadline implementation and local verification

The server assigns and schedules each deadline in the transaction that creates the pending offer or publishes a delivery version. Expiry reuses the normal slot or release transaction. Server time decides a late participant action. Only the current review on an accepted, funded offer at its recorded price can release. Approval uses the existing version, amount, licence and access controls. Old approvals without a reason display as client approvals.

Two hourly indexed jobs page through legacy rows with missing deadlines in batches of 32. Eligible rows receive a full window from initialization. Production scheduling starts only when this backend is deployed.

The conductor ran the suite, typecheck, build, fake-clock scheduler cases and a synthetic loopback Chromium walkthrough. The browser used actual workspace components at 1280 and 390 pixels and downloaded the original and licence for version 3 after automatic approval.

The starting suite passed 2 Node and 43 Vitest tests. Before the implementation, both offer responses and the review projection failed the new deadline assertions (3 failures). The independent design was frozen at SHA-256 `a71d5797a66406e89f1093b2f7bc19bb317297603aae0fe8b4373229ce8cec04`. Existing test cases and their discovery remain intact. Two files add an internal function reference and new cases. After the first green candidate a one-millisecond clock mismatch was fixed by starting synthetic time 60 seconds beyond fixture setup, so Convex's monotonic transaction clock and the test clock agree. No expected deadline, duration or precedence assertion was relaxed. Raw run outputs and the final source hashes accompany the review packet.
