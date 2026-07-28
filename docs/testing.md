# Testing Strategy

## Purpose

Testing verifies that product requirements, API contracts, frontend behavior, backend behavior, and database assumptions all match.

## Test Layers

### Backend Unit Tests

Validate:

- Request validation.
- Business rules.
- Error handling.
- Data mapping.

### Backend Integration Tests

Validate:

- API endpoints match `docs/openapi.yaml`.
- Database reads and writes work correctly.
- Error responses are stable.

### Frontend Unit and Component Tests

Validate:

- Components render expected states.
- User interactions trigger expected behavior.
- Form validation works before API submission.

### WeChat Mini Program Tests

When `frontend_targets.miniprogram: true`, validate:

- WXML/WXSS rendering, page lifecycle, navigation, and duplicate-submission prevention.
- WeChat authorization/privacy states and role-specific registration flows.
- Loading, empty, validation, pending-review, changes-requested, timeout, and retry states.
- Small-screen layout, readable errors, labels, and touch target behavior.

### Web Tests

When `frontend_targets.web: true`, validate:

- Semantic structure, responsive layouts, keyboard navigation, focus, and accessible names.
- Protected routes, session expiry, permission failures, and reviewer operations when Web owns the review surface.
- Loading, empty, validation, pending-review, changes-requested, error, retry, and destructive-action states.
- Browser integration and API contract behavior without exposing tokens or reviewer credentials.

### Mobile Unit, Component, and UI Tests

Validate:

- Shared mobile logic maps API data correctly.
- Screens render expected states.
- User interactions trigger expected behavior.
- Form and input validation work before API submission.
- Navigation, lifecycle, and error states behave correctly.

### Platform-Specific Mobile Tests

Validate:

- iOS-specific flows on iOS.
- Android-specific flows on Android.
- Secure storage and session handling work on each platform.

### End-to-End Tests

Validate:

- User workflows across frontend and backend.
- Loading, success, empty, and error states.
- Regression scenarios from closed issues.

## Test Agent Rules

- Test Agent must not silently fix frontend or backend implementation.
- When a test fails, create an issue under `issues/`.
- Every issue must include reproduction steps, expected behavior, actual behavior, owner, and retest result.
- A task cannot move to `Done` while linked issues remain open.
- `Ready for Retest` issues must be tested before new feature test work.
- Only Test Agent can move an issue from `Ready for Retest` to `Closed`.
- If retest fails, Test Agent must set the issue to `Retest Failed` and return it to the same owner.
- Mobile, iOS, and Android test runs are required when a task includes mobile scope.
- Frontend target test runs are required for every target marked `true` in `frontend_targets`.
- Each target result must be recorded in the task handoff and `frontend/HISTORY.md`.
- Every test run must record date, environment/build, exact command or manual check, result, and evidence location.
- A missing tool, environment, fixture, or credential is a blocker, not a passing result.
- Run `ruby scripts/validate_workflow.rb` before the final task transition.

## Automated Delivery Verification

The Test Agent and Orchestrator use `ruby scripts/deliver.rb <task>` to run the repeatable local verification loop. The runner reads `required_scopes` and `frontend_targets`, runs the applicable module checks from `product.yaml`, starts local Nest API / admin-web services for health checks, and writes command output and service logs under `/tmp/agent-delivery/EGoFind/<task-id>/` (see `delivery.evidence_root`).

Configured automated checks (when the corresponding scope/target is required):

| Check id | What it runs |
| --- | --- |
| `workflow` | `ruby scripts/validate_workflow.rb` |
| `backend-test` | `pnpm run test:unit` in `backend/` (nest build + geo unit) |
| `backend-prisma` | `pnpm exec prisma validate` |
| `backend-health` | `node dist/main.js` + `GET /health` (`EGOFIND_BOOT_WITHOUT_DB=1` so Nest can start without MySQL; body may be `db=down`) |
| `admin-presence` | `ruby scripts/check_admin_web.rb admin-web` |
| `admin-build` | `pnpm run build` in `admin-web/` |
| `admin-health` | serve `admin-web/dist` + `GET /index.html` |
| `miniprogram-presence` | `ruby scripts/check_mini_app.rb mini-app` |

Human gates (not auto-passed): production deploy, WeChat DevTools / real device, full `pnpm smoke:api` with Docker infra.

- A runner failure is a test failure with evidence, not an environment-independent assumption of failure or success.
- **Session Fix-to-Green:** after implementation or on `修到绿`, the chat Agent runs `deliver.rb`, then `summarize_delivery_failure.rb`, repairs the owning scope, and re-runs up to `delivery.max_rounds` (see root `AGENTS.md`). This does not replace Test Agent acceptance.
- When `DELIVERY_REPAIR_COMMAND` is configured, the runner may invoke an unattended repair owner and repeat checks for a bounded number of rounds (optional follow-up; not required for session Fix-to-Green).
- When repair cannot run, the missing tool, credential, fixture, or platform environment is recorded as a blocker.
- A passing runner does not close issues or replace independent Test Agent acceptance-criterion verification.
- WeChat DevTools authorization, real Mini Program rendering, production deployment, and other explicitly manual gates remain separate evidence items.

## Definition of Done

A task is done only when:

- Acceptance criteria pass.
- Required automated tests pass.
- Manual checks, if any, are recorded.
- Linked issues are closed.
- Every acceptance criterion has recorded evidence.
- All required task scopes are `Done`; excluded scopes are `N/A`.
- Release evidence is recorded when `release_required: true`.
- Workflow validation passes.
