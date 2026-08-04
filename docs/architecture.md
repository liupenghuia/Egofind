# Architecture — 系统边界索引

> **角色：** `product.yaml` → `truths.architecture`。  
> **定位：** 索引 + 边界摘要，**不**复制完整产品设计或 OpenAPI。  
> **详细：** 产品流程 → `product-design.md`；HTTP → `openapi.yaml`；表 → `database.md` / Prisma；客户端分层 → `client-architecture.md`；域规则 → `domain-rules.md`。

---

## 1. Architecture Style

- **模块化单体 + REST API**（NestJS）
- 客户端：微信小程序（Taro）+ 管理后台（Vite/React）
- 数据：MySQL（Prisma）+ Redis（可选限流/缓存）
- 外部：微信登录/手机号、腾讯地图 WebService（可选）

```text
mini-app / admin-web  ──JWT+REST──►  NestJS
                                      ├── MySQL
                                      ├── Redis（可选）
                                      ├── 微信
                                      └── 腾讯地图（可选）
```

---

## 2. System Boundaries

| Module | Responsibility | Owns | Does not own |
| --- | --- | --- | --- |
| auth | 登录、JWT | wechat/admin login | 业务行程 |
| users | 资料、手机号、取号 | phone enc、contact-phone | 匹配算法 |
| driver-trips | 车找人 | 行程 CRUD、发车鉴权（认证） | 乘客需求 |
| passenger-requests | 人找车 | 可见性 | 司机行程 |
| matching | 候选排序、确认、完成 | score、MatchOrder | 地图渲染 |
| map | markers、逆地理 | adcode 补全 | 匹配打分 |
| driver-verifications | 认证提交/审核 | profile 状态、driver 角色 | 发车表单 UI |
| reviews | 互评 | rating 唯一约束 | 信用分算法 |
| reports | 举报 | OPEN→CLOSED | 自动封禁策略 |
| notifications | 站内信 | push/list/read | 微信模板消息 |
| trip-feedbacks | 无法同行 + 月额度 | 限制发车/搜客 | 评价 |
| admin | 运营聚合 | RBAC admin 入口 | 小程序 UI |
| mini-app | 用户体验 | 页面、Zustand | 服务端鉴权逻辑 |
| admin-web | 运营台 | 审核/列表 | 匹配算法 |

---

## 3. Key Flows（指针）

1. 登录双模式 → `product-design` §2.1  
2. 发布与 adcode → `domain-rules` §2 + `product-design` §2.2–2.3  
3. 地图/列表发现 → map markers + matching for-*  
4. 确认同行与电话 → matching confirm + users contact-phone  
5. 完成与互评 → matching complete + reviews  
6. 认证 → driver-verifications + admin review  
7. 举报 → reports + admin resolve  

---

## 4. Security And Privacy

- JWT + RBAC（user / driver / admin）  
- 手机号加密存储 + PhoneAccessLog  
- 确认前不暴露完整电话（服务端强制）  
- 管理操作需 admin 角色  
- 密钥与生产发布为人闸（见 CLAUDE / delivery human_gates）  

---

## 5. Deployment And Rollback

- 本地：`docker compose` MySQL/Redis；`scripts/dev-stack.sh`  
- API 容器：compose profile `full`  
- 回滚：应用层回退镜像/commit；DB 用 Prisma migrate 纪律，禁止 silent destructive  
- 证据：`delivery.evidence_root`  

---

## 6. Decision Log

| 决策 | 记录位置 |
| --- | --- |
| 非对称联系权 | product-design 原则 2 |
| 匹配两层过滤 | product-design §4 |
| 发车需认证通过 | TASK-20260728-002 / driver-trips.create |
| OpenAPI 滞后时以代码为准 | docs/README 文档债 |

后续正式 ADR 可放 `docs/architecture/` 并在此表追加链接。
