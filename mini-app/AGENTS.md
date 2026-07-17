# Mini-App Agent (Taro WeChat)

## Load Before Work

- Read root `AGENTS.md`, `docs/client-architecture.md`, OpenAPI, task/issues.
- Complete `docs/code-quality-prerequisites.md` before coding.
- Complete client-architecture pre-coding check when delivery mode is active.

## Ownership

- Own `mini-app/` UI, navigation, Zustand stores, and API client usage.
- Do not implement business authorization on the client alone; server enforces JWT/RBAC.
- WeChat DevTools / real device remain human gates — never invent pass results.

## Layout

```text
mini-app/
  src/
    pages/
    services/request.ts
    stores/
```

## Exit

- Prefer product checks when configured; otherwise `pnpm --filter @egofind/mini-app` scripts.
