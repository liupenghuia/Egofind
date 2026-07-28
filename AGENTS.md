# AGENTS — Yi Go Find

Kit: agent-delivery-kit@0.2.1  
Kit path: `/Users/Penguin/Documents/PPFiles_Learn/agent-delivery-kit`  
Quality mode: code-first

## Instruction Order

1. This file (product overlay)
2. `product.yaml`
3. Kit / product docs: `docs/delivery-workflow.md`, `docs/code-quality-prerequisites.md`
4. Nearest role `AGENTS.md` under `backend/`, `mini-app/`, `admin-web/`, `tests/` (and `docs/roles/` for non-package roles such as UI Design)
5. Active task acceptance criteria, linked issues, and approved UI Specs under `docs/ui/specs/` when UI is in scope

Role instructions may tighten, but never weaken, this contract.  
Preserve unrelated user changes; never discard work to resolve a conflict silently.

## Code-First Contract

Users primarily want **high-quality code**, not gate ceremony.

1. Do **not** drive task/issue state machines unless the user explicitly asks for delivery, status, blockers, or gates (`交付`, `顺序完成`, release, etc.).
2. Before coding, complete `docs/code-quality-prerequisites.md` (intent, short baseline, ownership, robustness, minimal diff).
3. Prefer correctness, maintainability, extensibility, and robustness; do not swallow errors; keep auth on the server.
4. Prove behavior with local runnable checks; never report an assumed pass.
5. Report engineering outcomes: what changed, key trade-offs, how it was verified.

When the user requests closed-loop delivery, also follow `docs/delivery-workflow.md`.

## Iteration Contract

- Treat the latest explicit user intent and task acceptance criteria as the current source of truth.
- Establish a short baseline before editing; avoid reloading unrelated modules.
- Make the smallest change that produces observable acceptance evidence.
- Record adjacent improvements as follow-up work instead of expanding scope silently.

## Product Owner Entry Point

- Prefer `docs/product-request-template.md` for non-technical requests.
- **Pipeline source of truth:** `docs/delivery-pipeline.md` + `docs/roles/orchestrator.md`.
- Product owns scope and acceptance; **UI Design owns UI Specs** (`docs/ui/`); Architect owns technical boundaries; implementation agents own code; Test owns independent evidence.
- When the user says **`顺序完成`** or **`交付`**, act as Orchestrator and **auto-chain** without waiting for per-role commands:
  1. Product → 2. UI Design (if client UI in scope) → 3. Architect → 4. Backend / Mini-App / Web → 5. Test → runner as applicable.
- UI Design **starts automatically** from Product outputs (task, flows, acceptance); Spec is pipeline-`Approved` unless the user said `UI 需我确认` or `跳过 UI 设计`.
- Pause only for product tradeoffs, explicit UI confirmation request, production release, real user data, secrets, paid external actions, irreversible changes, or unavailable required platform access.
- Single-role commands (`产品` / `UI设计` / `架构` / …) still work for isolated work; they do **not** start the full chain unless combined with `顺序完成` / `交付`.

## Sources of Truth

| Concern | Source |
| --- | --- |
| Product shape | `product.yaml` |
| Pre-coding quality bar | `docs/code-quality-prerequisites.md` |
| Idea / MVP decision | `ideas/*.md`, `docs/product-discovery.md` |
| Product behavior | `docs/requirements.md`, task acceptance criteria |
| System boundaries | `docs/architecture.md` |
| Client structure | `docs/client-architecture.md` |
| UI / visual system | `docs/ui/design-system.md`, `docs/ui/specs/*` |
| UI Design role | `docs/roles/ui-design.md` |
| HTTP contract | `docs/openapi.yaml` |
| Data model | `docs/database.md` |
| Delivery state | YAML front matter in `tasks/*.md` and `issues/*.md` |
| Gates and transitions | `docs/delivery-workflow.md` |
| Sequential agent pipeline | `docs/delivery-pipeline.md` |
| Test policy | `docs/testing.md` |

## Role Commands

See `COMMANDS.md`. Command aliases may be customized in `product.yaml` under `commands`.

## Operating Contract (delivery mode)

When the user **explicitly** requests delivery:

- Run preflight, entry gate, work, verification, and exit gate from `docs/delivery-workflow.md`.
- Client implementation roles complete and record the client-architecture pre-coding check before code edits.
- Update task/issue front matter and append a handoff row on each transition.
- Use `P0`–`P3` priority; retests outrank new feature work at equal priority.
- Implementation owners may mark issues `Ready for Retest`; only Test Agent marks them `Closed`.
- Do not mark a task `Done` unless the validator and applicable quality gates pass.
- Record exact commands and results. If a required check cannot run, use `Blocked`; never report an assumed pass.

## Closed-Loop Delivery Rules

- Prefer `ruby scripts/deliver.rb <task>` after implementation and after every fix round.
- A failed runner check is actionable failure evidence; route to the owning scope.
- A runner pass is necessary but not sufficient; Test Agent still owns acceptance evidence and final test status.
- Preserve runner reports under the product's `delivery.evidence_root`.
- Never bypass production deployment approval, secret access, destructive changes, or unavailable platform-specific checks through the runner.

## Fix-to-Green Contract

**Goal:** after implementation (or when the user says `修到绿` / fix-to-green), keep repairing until local delivery checks are green — without waiting for the user to re-invoke between fix rounds.

### When it applies

1. Implementation work for a known task just finished, **or**
2. User says `修到绿 <task>` / `fix-to-green <task>`, **or**
3. Delivery / `顺序完成` reached the runner step.

Code-first work without a task file: still re-run the **same local checks you used to verify** after each fix; prefer `deliver.rb` when a task exists.

### Loop (session Agent is the repair owner)

```text
run: ruby scripts/deliver.rb <task>
  → pass: stop; report commands/results (runner green ≠ task Done)
  → fail:
      ruby scripts/summarize_delivery_failure.rb <task>
      read report + FAIL logs; minimal diff on owning scope only
      re-run deliver
  → repeat up to product.yaml delivery.max_rounds (default 3)
```

Rules:

1. **Do not stop** after the first red solely to ask “should I fix?” — fix until green, max rounds, or a hard stop.
2. **Minimal diff**; route by check id (backend / admin-web / mini-app / workflow). Do not “cleanup” unrelated modules.
3. **Hard stop** (record evidence + unblock condition; do not invent pass): production, secrets, real user data, paid/irreversible ops, WeChat DevTools / real device, missing infra for human-gated smoke.
4. **Bounded**: after `max_rounds` still red → stop with failure summary and next human action.
5. Optional unattended hook `DELIVERY_REPAIR_COMMAND` remains a **follow-up**; do not require it for session Fix-to-Green.

## Commit Attribution

When `quality.commit_coauthor` is true, AI commits must include:

```text
Co-Authored-By: <agent model and attribution byline>
```

Commit only when the user requests it.
