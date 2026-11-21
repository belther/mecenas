# Iteration 001 retrospective — 2026-11-21

Delivered a usable synthetic profile/request slice without production deployment.
The most useful reviews found independent-state UI races and the mismatch between
validated upload records and persisted storage IDs. The final recheck confirmed
all reported fixes. Keep image ownership and publication checks transactional.

Workflow limits were material: tool-route isolation stayed unverified, native
review tests hit Windows ancestor-path checks, and SPEC.md/spec.md collided in
one Windows packet. Use distinct names, exact file paths and full baseline file
snapshots in a future iteration. Do not widen filesystem access to make a review
runner pass without reviewing that boundary. Runtime source reads and the actual
WASM dependency loader were necessary to establish meaningful auth tests.

The pilot used the approved two repair cycles. No Anvil package was edited or
upgraded. Improvements above are proposals for a separately evaluated workflow
release, not new standing rules. Project code/evidence remain in Mecenas.
