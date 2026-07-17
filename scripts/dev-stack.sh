#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting MySQL + Redis (requires Docker)"
if command -v docker >/dev/null 2>&1; then
  docker compose up -d mysql redis
else
  echo "WARN: docker not found; ensure MySQL/Redis already running on 3306/6379"
fi

echo "==> Install deps"
pnpm install

echo "==> Prisma generate + migrate + seed"
pnpm db:generate
pnpm --filter @egofind/backend exec prisma migrate deploy
pnpm db:seed

echo "==> Start API (foreground). Admin: pnpm dev:admin  Mini: pnpm dev:mini"
pnpm dev:backend
