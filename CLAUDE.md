# Claude entry

This repository uses **agent-delivery-kit** for multi-agent delivery.

1. Read root `AGENTS.md` and `product.yaml` first.
2. Follow `docs/code-quality-prerequisites.md` before any code change (code-first default).
3. Use `docs/delivery-workflow.md` only when the user explicitly asks for delivery, status, blockers, or gates (`交付`, `顺序完成`, release).
4. When changing delivery state, run:
   - `ruby scripts/doctor.rb`
   - `ruby scripts/validate_workflow.rb`
   - `ruby scripts/deliver.rb <task>` after implementation / fix rounds
5. **Fix-to-Green:** on deliver failure, run `ruby scripts/summarize_delivery_failure.rb <task>`, minimal-fix owning scope, re-deliver up to `max_rounds` without waiting for the user to re-invoke (see root `AGENTS.md`).

Short commands: see `COMMANDS.md` (`修到绿 <task>`).  
Do not invent pass results for checks that did not run.
