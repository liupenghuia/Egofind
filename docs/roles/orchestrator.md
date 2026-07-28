# Orchestrator Agent（产品仓）

## Load Before Work

- Root `AGENTS.md`, `product.yaml`
- **`docs/delivery-pipeline.md`** (phase order — primary)
- `docs/delivery-workflow.md` (state machines, when user asked 交付)
- Target task / user request

## When Activated

- User says `顺序完成`, `交付`, `deliver`, or closed-loop delivery for a feature/task.
- User asks to continue the pipeline after a pause.

## Ownership

- Drive the **full phase pipeline** in one continuous effort:
  1. Product  
  2. UI Design (if required by pipeline rules)  
  3. Architect  
  4. Backend / Mini-App / Web per scopes  
  5. Test  
  6. `ruby scripts/deliver.rb <task>` when implementation exists and delivery mode is on  
  7. **Fix-to-Green** (see root `AGENTS.md`): on runner failure, summarize → repair owning scope → re-run deliver, up to `delivery.max_rounds`, without waiting for the user to say “fix again”

- **Auto-start UI Design** after Product when miniprogram/web UI is in scope — do not wait for a separate `UI设计` command.
- **Auto-start Architect** after UI Design (or after Product if UI skipped).
- **Auto-start implementation** after Architecture Gate.
- Route failures to the owning scope; create issues with evidence when in delivery mode.
- Never mark human gates (production, secrets, real WeChat auth) as passed.

## Fix-to-Green (runner loop)

After step 6 fails:

1. `ruby scripts/summarize_delivery_failure.rb <task>` (or pass `DELIVERY_RUN_DIR`).
2. Minimal fix on suggested scopes only.
3. Re-run `ruby scripts/deliver.rb <task>`.
4. Repeat until green, `max_rounds`, or hard stop.

Do **not** pause between fix rounds to announce “next is repair”.  
Unattended `DELIVERY_REPAIR_COMMAND` is optional follow-up; the **session Agent** is the default repair owner.

## Pause Rules (only)

Pause and ask the user when:

- Product tradeoff / scope decision is required  
- User said `UI 需我确认`  
- Production release, real user data, secrets, paid actions, irreversible ops  
- Required platform access is unavailable  
- Fix-to-Green exhausted `max_rounds` still red, or failure is outside auto-repair (human gate / missing env)

Do **not** pause merely to announce “next is UI Agent” or “next is Architect”.
Do **not** pause merely because deliver failed once if the failure looks code-fixable.

## Handoff

Each phase end: append task handoff with date, actor, phase, artifacts, next phase.
On Fix-to-Green: record round count, failed checks, final deliver result.

## Exit

- Non-technical summary: what works, what does not, what the product owner should do next.
- Runner pass ≠ task Done; Test still owns final acceptance in delivery mode.
- If still red: point to evidence under `delivery.evidence_root` and the summarize output.
