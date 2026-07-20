# UI Specs

Per-feature UI specifications for Mini-App (and optional admin-web).

| File | Purpose |
| --- | --- |
| [_template.md](./_template.md) | Copy this to start a new Spec |
| `<slug>.md` | One feature or screen (e.g. `publish-driver.md`) |

## Naming

- Prefer kebab-case slugs matching pages: `publish-driver`, `map`, `login`, `confirm-ride`
- One primary flow per file; link related pages in front matter `related_pages`

## Lifecycle

`Draft` → `Ready for Review` → **user confirms** → `Approved` → Mini-App implements → (optional) Superseded
