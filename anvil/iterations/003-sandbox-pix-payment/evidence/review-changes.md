# Review repairs

The independent reviewers received a read-only copy of the approved
specification and selected source. Their first read was truncated. The
code reviewer identified missing three-slot and local-persistence-failure
coverage. The conductor added a single test that exercises both, including
recovery by reference after provider success.

The dev bundler exposed a Node runtime boundary that typecheck alone did
not detect. Moved the provider adapter into `lib/pix-provider.ts`, outside
the Convex function discovery tree, so only the Node action imports it.

Retry now treats only named provider validation rejections as definite
creation failures. An unclassified response keeps the existing attempt in
verification, including an unclassified HTTP 400.
