# Commands

Use these short commands when asking an agent to work in this repository.

## Idea Discovery

```text
想法 smart-expense-assistant
```

English equivalent: `idea smart-expense-assistant`.

Include the raw idea after the command. If `ideas/smart-expense-assistant.md` does not exist, Product Agent creates it from `ideas/template.md`, separates facts/assumptions/unknowns, defines the problem, user, MVP, journey, metrics, risks, and presents a product recommendation. It stops at `Ready for Review` unless the recorded decision owner approves.

## Product

```text
产品 user-management
```

Expands to: continue discovery when the name matches an idea, or update requirements and task acceptance criteria when it matches a task. An approved idea is promoted into requirements and bidirectionally linked task files.

## Architect

```text
架构 user-management
```

Expands to: read architecture rules, update `docs/architecture.md`, `docs/openapi.yaml`, `docs/database.md`, and confirm task readiness.

## Backend

```text
后端 user-management
```

Expands to: read backend rules, check backend issues first, then implement backend work for the task.

## Mobile

```text
移动端 user-management
```

Expands to: read mobile rules, check mobile issues first, then implement shared mobile work for the task.

## iOS

```text
iOS user-management
```

Expands to: read iOS rules, check iOS issues first, then implement iOS work for the task.

## Android

```text
安卓 user-management
```

Expands to: read Android rules, check Android issues first, then implement Android work for the task.

## Frontend

```text
前端 user-management
```

Expands to: read frontend rules, check frontend issues first, then implement frontend work for the task.

## UI / UX Design

```text
UI设计 发布车找人
```

English equivalents: `ui-design publish-driver`, `设计 发布车找人`.

Expands to:

1. Read `docs/roles/ui-design.md` and `docs/ui/design-system.md`.
2. Create or update `docs/ui/specs/<slug>.md` from `docs/ui/specs/_template.md`.
3. Update `docs/ui/design-system.md` only when introducing reusable tokens or components.
4. Set Spec status to `Ready for Review` and **stop for user confirmation** (unless the user waived the pause).
5. Do **not** implement `mini-app/` or `admin-web/` in this step.

After the user approves the Spec, run `小程序 …` (or `Web …`) to implement.

Skip UI Design only when the user says so (e.g. bugfix, pure logic): `跳过 UI 设计` then implement directly using design-system defaults.

## WeChat Mini Program

```text
小程序 user-management
```

English equivalent: `miniprogram user-management`.

Expands to:

1. Read `mini-app/AGENTS.md`, `docs/client-architecture.md`, and `docs/ui/design-system.md`.
2. If a related UI Spec exists under `docs/ui/specs/` (or the task links `ui_spec`), follow it when `status` is `Approved` (or the user explicitly says to implement a Draft/Ready Spec).
3. If the user required UI Design first and no Spec is approved, write/update the Spec via UI Design workflow or ask—do not invent a full visual system in chat only.
4. Implement only the miniprogram target (`mini-app/`); record commands/results when in delivery mode.
5. WeChat DevTools / real device remain human gates—never invent pass results.

Legacy kit paths `frontend/AGENTS.md` / `frontend/miniprogram/` map to this repo’s `mini-app/`.

## Web

```text
Web user-management
```

English equivalent: `web user-management`.

Expands to: read `admin-web/AGENTS.md` and `docs/client-architecture.md`, check Web issues first, then implement only the web target (`admin-web/`). Prefer Ant Design patterns; optional UI Spec when `target: admin-web` or `both`. Legacy kit path `frontend/web/` maps to `admin-web/`.

## Test

```text
测试 user-management
```

Expands to: read test rules, retest `Ready for Retest` issues first, then test the task.

## Sequential Pipeline (recommended for product owners)

```text
顺序完成：

[需求描述]
```

English: `sequential` / same body under `交付`.

Expands to Orchestrator mode per **`docs/delivery-pipeline.md`** — **do not wait** for separate role commands:

1. **Product** — scope, flows, acceptance, scopes/targets, `ui_spec` path or `N/A`
2. **UI Design** (auto) — if miniprogram/web UI is needed; write `docs/ui/specs/*`; default `Approved` in pipeline
3. **Architect** (auto) — boundaries, API, DB, security using product + UI Spec
4. **Backend / Mini-App / Web** (auto) — by `required_scopes` / `frontend_targets`
5. **Test** — acceptance + UI Spec checks as applicable
6. Local `ruby scripts/deliver.rb <task>` when a task file exists (delivery mode)

Modifiers in the same message:

- `UI 需我确认` — pause after UI Spec
- `跳过 UI 设计` — skip UI phase
- `只要小程序` / `不要管理端` — Product sets targets

## Autonomous Delivery

```text
交付 user-management
```

English equivalent: `deliver user-management`.

Expands to the **same pipeline** as `顺序完成` (see `docs/delivery-pipeline.md` and `docs/roles/orchestrator.md`), plus task/issue state machines and handoffs from `docs/delivery-workflow.md`, until the task is `Done` or a documented approval/blocker requires user input.

Phase auto-chain: Product → UI Design (if UI) → Architect → implementation → Test. Repository edits and local checks continue without asking the user to re-invoke each agent; production, destructive, secret, paid, legal, and unresolved product decisions still require approval.

### Local Delivery Runner

The repository also provides an executable local loop:

```bash
ruby scripts/deliver.rb user-management
```

The runner validates workflow metadata, executes required module checks, starts local backend/Web services for health checks, saves evidence, and can invoke a configured repair command before retesting. Configure `DELIVERY_REPAIR_COMMAND` or pass `--repair-command`; the default maximum is three rounds.

**Session Fix-to-Green (default):** the chat Agent repairs from evidence without requiring `DELIVERY_REPAIR_COMMAND`. See root `AGENTS.md` → Fix-to-Green Contract. Unattended repair via env hook is an optional follow-up.

### Fix-to-Green

```text
修到绿 user-management
```

English: `fix-to-green user-management`.

Expands to (same session, no waiting for “fix again”):

1. `ruby scripts/deliver.rb <task>`
2. On failure: `ruby scripts/summarize_delivery_failure.rb <task>`
3. Minimal code fix on suggested scopes only
4. Re-run deliver until green, `delivery.max_rounds`, or a hard stop (human gate / missing env)
5. Report rounds, commands, and final result — never invent a pass

Also runs automatically after implementation when a task exists and after the deliver step of `顺序完成` / `交付`.

```bash
# Inspect latest failed run without repairing
ruby scripts/summarize_delivery_failure.rb user-management
# Or: DELIVERY_RUN_DIR=/tmp/agent-delivery/EGoFind/<id>/<run> ruby scripts/summarize_delivery_failure.rb
```

## Next Work

```text
下一个 前端
下一个 小程序
下一个 Web
下一个 UI设计
下一个 后端
下一个 移动端
下一个 iOS
下一个 安卓
下一个 测试
```

Expands to: pick `Ready for Retest` first at equal priority, then owned issues, then eligible tasks. Sort by `P0` through `P3`, then oldest creation date. For `下一个 UI设计`, prefer Specs in `Ready for Review` or tasks that need a Spec before miniprogram work.
