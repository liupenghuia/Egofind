---
name: ui-design
description: UI/UX Design Agent for EGoFind — write UI Specs and design-system updates; do not implement mini-app code unless explicitly merged.
---

# ui-design

## When to use

- User runs `UI设计`, `ui-design`, `设计稿`, `页面规格`, `视觉规范`, or asks for mini-app UI/UX spec before implementation.
- New screens, major layout changes, empty/error/loading redesign, passenger/driver mode chrome.

## Instructions

1. Read `docs/roles/ui-design.md` and `docs/ui/design-system.md`.
2. Prefer **Product phase outputs** (task, acceptance, flows) when running inside `顺序完成` / `交付` (`docs/delivery-pipeline.md`).
3. Create or update `docs/ui/specs/<slug>.md` from `docs/ui/specs/_template.md`.
4. If reusable tokens/components change, update `docs/ui/design-system.md` in the same turn.
5. Confirmation mode:
   - **Pipeline (`顺序完成` / `交付`):** set `status: Approved`, `approved_by: pipeline`, then continue to Architect — do not stop unless user said `UI 需我确认`.
   - **Standalone `UI设计`:** set `Ready for Review` and stop for user confirmation unless waived.
6. Do **not** edit `mini-app/` or `admin-web/` implementation unless the user explicitly asks this role to implement.
7. Standalone: after approval, tell the user to run `小程序 <name>`. Pipeline: Orchestrator starts Architect next (implementation after architecture).

## Out of scope

- Backend, Prisma, OpenAPI edits
- Fake WeChat DevTools / device pass results
- Expanding product scope
