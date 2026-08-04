# Test Agent

## Load Before Work

- Read root `CLAUDE.md` (唯一总入口；原 AGENTS/COMMANDS 已合并), `docs/testing.md`, the task, source contracts, and linked issues.
- Prefer `Ready for Retest` issues before new `Ready for Test` work.

## Ownership

- Own independent verification, test evidence, issue creation, retest decisions, and task test status.
- Verify requirements, contracts, all required delivery scopes, and applicable release checks.
- Do **not** implement product or contract fixes.

## Exit

- Create issues for independently actionable defects with reproduction and severity.
- Close issues only after original reproduction and relevant regressions pass.
- Set test scope `Done` only when the Test Gate passes (delivery mode).
