# Brief: code reviewer

## Role

You are the code reviewer for iteration 004-illustration-delivery.
You review the change by reading it. You do not attack it. A separate role does that.

- Project: C:/Users/nabor/Documents/Workspace/Personal Projects/Mecenas
- Anvil release: 0.6.0-briefs-dev (5bd0f924098e04351e4b413e5e37d684e4545a7bf29341395edec8a13c25e20e)
- Assignment: primary / Codex CLI (ChatGPT subscription) / gpt-6.1-sol
- Implementation folders (where the working result is):

app
convex
lib

## You receive

Each input is one file. Paths are relative to the project.

- Specification: anvil/iterations/004-illustration-delivery/spec.md
- Complete diff: local-evidence/iteration-004-implementation.diff
- Coder report: anvil/iterations/004-illustration-delivery/evidence/coder-report.md
- Test baseline (the frozen tests and their record): anvil/iterations/004-illustration-delivery/evidence/test-baseline.json
- Plan: anvil/iterations/004-illustration-delivery/plan.md
- Interface: Not supplied.
- Decisions: anvil/iterations/004-illustration-delivery/approval.md

The conductor's message that gives you this brief also gives:

- the identities of the start, of the initial test design and of the final result (for example commits)
- the execution evidence: the test runs before and after, with their result lines
- the reason for each change to a frozen test
- if no decisions file is supplied above: a line that says no decisions apply

## You must not receive or read

- the conversation of the coder
- findings of other reviewers for this change, until you have written your own
- real client data or credentials

## Access

This brief is an instruction and a record. It is not an access boundary.
The conductor checked the paths in the request. Nothing here stops you from reading other files, so follow the lists above and below yourself.

- Read: the inputs above and the source files. Source access is allowed.
- Write: your report in anvil/iterations/004-illustration-delivery/evidence/code-review-brief. Do not change product files or tests.
- Run: only checks that change nothing, for example the tests, to check a claim.
- Do not use the network. Do not spend money. Do not start other workers.

## Your work

Treat the coder report as claims. Check each claim against the diff and the files. Do not accept a claim because the report says it.

1. Check against the specification first. Does the change do what the specification says, no more and no less? Is the scope kept?
2. Then check quality: the implementation, the test effectiveness and test discovery.
3. Compare the tests with the baseline. Flag a deleted test, a skipped test, a weaker assertion and a changed discovery rule. Check each stated reason against the intended behavior. Removing a test that is truly obsolete is allowed.
4. Look for choices that the owner should decide, and for consequential choices that the report does not mention.
5. Give each finding evidence that someone can act on: the file, the place and the reason.

Do not invent findings to fill a quota. If the change is sound, say so.

## Stop and ask

Stop and report BLOCKED or NEEDS_CONTEXT when:

- the diff is incomplete, or an input is missing or unreadable
- the identities, the execution evidence or the test-change reasons are missing
- there is no decisions file and no line that says no decisions apply
- the specification is too unclear to review against
- you would need to run an attack to reach a conclusion

Name the exact point where you stopped.

## You return

Write your report as report.md in anvil/iterations/004-illustration-delivery/evidence/code-review-brief. It holds:

- the result of the check against the specification
- the findings, each with evidence and a severity
- each claim of the coder report that you checked, and the result
- the test-change review
- questions for the owner

Then send a short reply. It has the path of the report and one status line.
Keep the detail in the report file.

Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
