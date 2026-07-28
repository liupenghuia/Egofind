---
name: agent-delivery
description: Multi-agent closed-loop delivery using agent-delivery-kit (code-first by default; sequential pipeline on 顺序完成/交付 including auto UI Design; Fix-to-Green after runner failures).
---

# agent-delivery

## When to use

- User mentions `交付`, `顺序完成`, task/issue status, gates, release, or closed-loop delivery.
- User wants the full Product → UI → Architect → Dev → Test chain.
- User says `修到绿` / `fix-to-green`, or implementation just finished and local checks / `deliver.rb` failed.

## Instructions

1. Load root `AGENTS.md` and `product.yaml`.
2. **If `顺序完成` or `交付`:** follow **`docs/delivery-pipeline.md`** and **`docs/roles/orchestrator.md`** — auto-chain phases in one session:
   1. Product (requirements, task, scopes, `ui_spec` path or N/A)
   2. UI Design when miniprogram/web UI is needed — Spec under `docs/ui/specs/`, default `Approved` (`approved_by: pipeline`) unless user said `UI 需我确认` or `跳过 UI 设计`
   3. Architect (consume product + UI Spec)
   4. Backend / Mini-App / Web by scopes (Mini-App follows Spec)
   5. Test; then `ruby scripts/deliver.rb <task>` when applicable
   6. **Fix-to-Green** if deliver fails (below)
   - Do **not** wait for the user to type `UI设计` / `架构` / `小程序` between phases.
3. **If only code work without those triggers:** code-first via `docs/code-quality-prerequisites.md`; do not run the full pipeline. Still re-run the checks you used after each fix.
4. Delivery state machines: `docs/delivery-workflow.md` when updating task/issue status.
5. Validate with `ruby scripts/validate_workflow.rb` before changing delivery state.
6. Record exact commands and results; never invent pass results.

## Fix-to-Green (mandatory after runner / verification red)

Session Agent **is** the repair owner (do not require `DELIVERY_REPAIR_COMMAND`).

```text
ruby scripts/deliver.rb <task>
  fail → ruby scripts/summarize_delivery_failure.rb <task>
       → minimal fix on suggested scope only
       → deliver again
  until green | max_rounds (product.yaml delivery.max_rounds, default 3) | hard stop
```

- Triggers: implementation finished with a task; user `修到绿 <task>`; pipeline step after deliver.
- Do **not** stop after first red only to ask permission to fix code-level failures.
- Hard stop (no fake green): production, secrets, real device / WeChat DevTools, paid/irreversible, missing human-gated infra.
- Runner green ≠ task `Done`; Test still owns acceptance in delivery mode.
- Unattended `DELIVERY_REPAIR_COMMAND` is a documented follow-up, not required for this loop.

See `COMMANDS.md` and `docs/product-request-template.md`.
