# @egofind/backend

NestJS + Prisma + MySQL + Redis API for EGoFind.

## Stack

- NestJS modular: Auth / Users / Roles
- Prisma ORM + MySQL
- Redis (optional health probe)
- JWT + WeChat openid login + RBAC guards
- class-validator + Swagger
- Unified response: `{ code, message, data }`

## Quick start

### 1. Infrastructure

From repo root:

```bash
docker compose up -d mysql redis
```

### 2. Install & migrate

```bash
# repo root
pnpm install

cd backend
cp .env.example .env   # if needed
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
pnpm dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api-docs  
- Health: `GET /health`

### 3. Smoke

```bash
# health
curl -s http://localhost:3000/health | jq

# wechat mock login (WECHAT_MOCK=1)
curl -s -X POST http://localhost:3000/auth/wechat \
  -H 'Content-Type: application/json' \
  -d '{"code":"demo-001"}' | jq

# admin login (seed)
curl -s -X POST http://localhost:3000/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123!"}' | jq
```

Default seed admin: **admin / Admin123!** (local only).

## WeChat placeholders

| Env | Description |
| --- | --- |
| `WECHAT_APPID` | Mini-program AppID (replace `your-wechat-appid`) |
| `WECHAT_SECRET` | Mini-program secret |
| `WECHAT_MOCK` | `1` = skip real code2session; openid = `mock_${code}` |

登录后会缓存 `session_key`（Redis 或内存）。手机号：

- 推荐：`POST /users/phone/bind` + 微信 `getPhoneNumber` 的 **code**
- 兼容：`encryptedData` + `iv`（session_key AES）
- Mock：`{ "phoneNumber": "13800138000" }`

详见 `docs/wechat-setup.md`。

```bash
pnpm test:unit   # build + geo 自检
```

## API surface (step 3)

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/health` | public |
| POST | `/auth/wechat` | public |
| POST | `/auth/admin/login` | public |
| GET | `/auth/me` | JWT |
| GET | `/users` | JWT + role `admin` |

## Docker full stack

```bash
# includes api service (profile full)
docker compose --profile full up -d --build
```
