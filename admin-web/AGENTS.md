# Admin Web Agent (React + Vite + Ant Design)

## Load Before Work

- Read root `CLAUDE.md` (唯一总入口；原 AGENTS/COMMANDS 已合并), `docs/client-architecture.md`, OpenAPI, task/issues.
- Prefer Ant Design 5 patterns; when a UI Spec targets `admin-web` or `both`, read `docs/ui/specs/` and `docs/roles/ui-design.md`.
- Complete `docs/code-quality-prerequisites.md` before coding.
- Complete client-architecture pre-coding check when delivery mode is active.

## Ownership

- Own `admin-web/` UI, routing, Axios client, and client-side permission gates (UX only).
- Server remains source of truth for RBAC; hide menus client-side but never rely on that alone.
- Replaces former `frontend/web` static admin.

## Layout

```text
admin-web/
  src/
    api/
    layouts/
    pages/
    router/
```

## Exit

- Prefer product checks when configured; otherwise `pnpm --filter @egofind/admin-web` build/lint.
