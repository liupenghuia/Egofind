# Mini-App Agent (Taro WeChat)

## Load Before Work

- Read root `AGENTS.md`, `docs/client-architecture.md`, OpenAPI, task/issues.
- Read **`docs/ui/design-system.md`** (tokens, dual mode, empty/error patterns).
- If the task or user names a feature, check **`docs/ui/specs/`** for a matching Spec.
- Complete `docs/code-quality-prerequisites.md` before coding.
- Complete client-architecture pre-coding check when delivery mode is active.

## UI Spec Gate (Scheme B)

| Situation | Action |
| --- | --- |
| Spec `status: Approved` (or user says implement this Spec) | Implement against Spec; do not change layout semantics without updating Spec |
| User said `UI设计` first / new screen / major UI change, Spec missing or still `Draft` | Do not freestyle UI—run UI Design workflow or wait for approval |
| User said `跳过 UI 设计` / bugfix / pure logic | Proceed with design-system defaults only |
| Spec conflicts with design system | Prefer updated design system; note follow-up to sync Spec |

**Role split:** UI Design Agent owns Spec files under `docs/ui/`. This agent owns Taro implementation under `mini-app/`.

See `docs/roles/ui-design.md` and `COMMANDS.md` (`UI设计` / `小程序`).

## Ownership

- Own `mini-app/` UI implementation, navigation, Zustand stores, and API client usage.
- Prefer `src/styles/tokens.scss` over raw hex colors; extend design system when a new token is required.
- Do not implement business authorization on the client alone; server enforces JWT/RBAC.
- WeChat DevTools / real device remain human gates — never invent pass results.

## Layout

```text
mini-app/
  src/
    styles/tokens.scss   # design tokens
    pages/
    services/request.ts
    stores/
```

## Exit

- Prefer product checks when configured; otherwise `pnpm --filter @egofind/mini-app` scripts + `pnpm check:mini`.
- When a Spec was used, tick UI acceptance items in the Spec or task handoff (delivery mode).
