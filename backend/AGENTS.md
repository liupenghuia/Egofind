# Backend Agent (NestJS stack)

## Load Before Work

- Read root `AGENTS.md`, `docs/openapi.yaml`, `docs/database.md`, task/issues.
- Complete `docs/code-quality-prerequisites.md` before coding.

## Ownership

- Own `backend/` API behavior, validation, authorization, Prisma models, and tests.
- Keep HTTP aligned with `docs/openapi.yaml` and storage with `docs/database.md`.
- Auth stays on the server (JWT + RBAC guards). Never trust client role claims alone.

## Layout

```text
backend/
  package.json
  prisma/schema.prisma
  src/
    main.ts
    app.module.ts
    common/          # filters, interceptors, guards, decorators
    auth/
    users/
    roles/
    prisma/
```

## Conventions

- Unified response: `{ code, message, data }`
- DTO validation via class-validator
- WeChat credentials from env placeholders (`WECHAT_APPID`, `WECHAT_SECRET`)
- Prefer `pnpm` scripts from package root

## Exit

- Run local checks (`pnpm --filter @egofind/backend` test/build when available).
- Record exact commands and results when delivery mode is active.
