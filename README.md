# egofind（EGoFind）

同城/县域 **顺风车双向匹配** 平台：单小程序乘客/司机双模式 + NestJS API + 管理后台。

## 架构

| 包 | 路径 | 技术 |
| --- | --- | --- |
| `@egofind/backend` | `backend/` | NestJS · Prisma · MySQL · Redis · JWT · RBAC |
| `@egofind/mini-app` | `mini-app/` | Taro 4 · React · TS · Zustand · 地图 |
| `@egofind/admin-web` | `admin-web/` | React 18 · Vite · Ant Design 5 · Axios |

产品设计：`docs/product-design.md`  
数据模型：`docs/database.md`

```text
小程序 / 管理后台  ──REST+JWT──►  NestJS  ──►  MySQL
                                   └──►  Redis / 微信 / 腾讯地图(可选)
```

## 快速启动

### 前置

- Node ≥ 18、pnpm 9
- Docker（MySQL + Redis）；若本机无 Docker，请自备 `localhost:3306` / `6379`

### 1. 依赖

```bash
pnpm install
```

### 2. 基础设施

```bash
# 有 Docker 时
docker compose up -d mysql redis

# 或一键脚本（migrate + seed + API）
chmod +x scripts/dev-stack.sh
./scripts/dev-stack.sh
```

### 3. 数据库

```bash
cp backend/.env.example backend/.env   # 按需修改
pnpm db:generate
pnpm --filter @egofind/backend exec prisma migrate deploy
pnpm db:seed
```

默认管理员：**admin / Admin123!**

### 4. 启动各端

```bash
pnpm dev:backend    # http://localhost:3000  Swagger /api-docs
pnpm dev:admin      # http://localhost:5173
pnpm dev:mini       # 微信开发者工具打开 mini-app/dist
```

### 5. 冒烟 API

```bash
curl -s http://localhost:3000/health
curl -s -X POST http://localhost:3000/auth/wechat \
  -H 'Content-Type: application/json' -d '{"code":"demo"}'
curl -s -X POST http://localhost:3000/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123!"}'
```

## 核心业务 API

| 能力 | 路径 |
| --- | --- |
| 微信登录 | `POST /auth/wechat` |
| 管理登录 | `POST /auth/admin/login` |
| 车找人 | `POST /driver-trips` |
| 人找车 | `POST /passenger-requests` + `PATCH .../visibility` |
| 地图标记 | `GET /map/markers?mode=passenger\|driver` |
| 匹配 | `GET /matching/for-passenger/:id` · `POST /matching/confirm` |
| 乘客取司机电话 | `GET /users/contact-phone/:matchOrderId` |
| 后台 | `/admin/*`（需 admin 角色） |

统一响应：`{ code, message, data }`

## 配置要点

| 变量 | 说明 |
| --- | --- |
| `WECHAT_APPID` / `WECHAT_SECRET` | 小程序（占位） |
| `WECHAT_MOCK=1` | 本地 mock openid/手机号 |
| `PHONE_ENCRYPTION_KEY` | 手机号 AES 加密 |
| `MATCH_SCOPE` | `county`（默认）或 `city` |
| `MATCH_DMAX_KM` | 距离满分上限 km |
| `TENCENT_MAP_KEY` | 腾讯 WebService（逆地理补 adcode） |
| `DEFAULT_ADCODE` | 无 Key / 失败时默认区县 |
| `TARO_APP_API_BASE` | 小程序 API 根地址 |
| `mini-app/project.config.json` → `appid` | 替换为真实小程序 AppID |

### 微信小程序

1. 替换 `project.config.json` 的 `appid`
2. 开发者工具导入 `mini-app`（编译产物目录 `dist/`）
3. 详情 → 本地设置：不校验合法域名（开发）
4. 手机号：真机用 `getPhoneNumber`；本地 `POST /users/phone/bind` + mock

## Docker

```bash
docker compose up -d mysql redis          # 开发常用
docker compose --profile full up -d --build  # 含 API 容器
```

## 安全设计摘要

- **联系权非对称**：仅乘客确认同行后可拉司机电话；司机端无拨号入口
- 乘客需求 **HIDDEN** 不进入司机地图与匹配
- 手机号加密存储 + `phone_access_logs` 审计
- JWT + RBAC（`user` / `driver` / `admin`）

## 联调脚本

```bash
# 地理工具自检（无需 DB）
pnpm test:backend

# API 冒烟（需 API 已启动且 DB 已 seed）
pnpm smoke:api
# 或 API_BASE=http://127.0.0.1:3000 bash scripts/smoke-api.sh
```

## 待办 / 后续

- [ ] 本机安装 Docker 后完整 migrate 冒烟（`./scripts/dev-stack.sh`）
- [x] 微信 `getPhoneNumber` code 换号 + session_key 旧版解密 + mock
- [x] 小程序 `chooseLocation` 选点 + 逆地理 adcode
- [x] 腾讯逆地理 WebService（`/map/reverse-geocode`，无 Key mock）
- [x] 发布接口服务端 enrichPlace 双保险
- [x] 对齐 `product.yaml` delivery checks 到 monorepo（Nest / admin-web / mini-app）
- [ ] 管理端嵌入腾讯地图 JS SDK
- [ ] 发布频控、敏感词、对象存储证件图
- [ ] 小程序 `taro build` 工具链（当前 DevTools / 全量编译为人工门禁）

## 文档

- `docs/product-design.md` — 产品设计与匹配算法
- `docs/database.md` — 表结构
- `docs/requirements.md` — 需求摘要
- `docs/ui/` — UI Design System + 页面 Spec
- `docs/delivery-pipeline.md` — **顺序完成** 自动链路：产品 → UI → 架构 → 开发 → 测试
- `docs/roles/ui-design.md` / `docs/roles/orchestrator.md` — UI Design 与编排
- `backend/README.md` / `mini-app/README.md` / `admin-web/README.md`
