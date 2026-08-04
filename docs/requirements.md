# Requirements — egofind

> **短真相源**（`truths.requirements`）。长设计见 [`product-design.md`](./product-design.md)；文档地图见 [`README.md`](./README.md)。  
> Active slice 表示**当前产品焦点**；历史 task 详情在 `tasks/`。

## Product Goal

同城/县域顺风车双向匹配平台：在同一县城/市区（adcode）内撮合「车找人」与「人找车」，乘客确认同行后方可获取授权电话；单小程序支持乘客/司机双模式切换。

完整设计见 [product-design.md](./product-design.md)。

## Users

| Persona | Goals | Constraints |
| --- | --- | --- |
| 乘客 | 发布人找车、地图发现司机、确认同行并电话联系 | 电话需微信授权；可隐藏需求 |
| 司机 | 发布车找人、查看匹配乘客 | 不可主动拨打对方电话；需认证后发车 |
| 管理员 | 用户/订单/举报/司机认证/区县统计 | 仅 admin 角色 |

## Core Capabilities

1. 微信登录 + JWT + RBAC（user / driver / admin）
2. 司机发布车找人；乘客发布人找车（公开/隐藏）
3. 分层匹配：同 adcode → 时间重叠 + 距离 + 方向相似度
4. 地图标记与详情（腾讯地图）
5. 乘客确认同行 + 手机号解密（非对称联系权）
6. 举报、互评、订单生命周期
7. 管理后台：用户/订单/审核/统计

## Active product slice

- **切片收口（2026-07-30）**：体验 U0～U4 均 Done。续作见 [`NEXT.md`](./NEXT.md)。  
- **TASK-20260730-005**（Done）：体验 U4 业务补全  
- **TASK-20260730-004**（Done）：体验 U3 视觉精细化  
- **TASK-20260730-003**（Done）：体验 U2  
- **TASK-20260730-002**（Done）：体验 U1  
- **TASK-20260730-001**（Done）：体验 U0  
- 业务主路径与安全整改：见 `tasks/`  

**注意：** 需 `prisma migrate deploy` 应用 `legal_and_report_audit` 与 `match_cancel_fields`。  

## Non-Goals

- 在线支付、实时轨迹、IM、跨城长途、强制派单

## Non-Functional Requirements

- Security: 服务端鉴权、手机号加密存储、PhoneAccessLog、限流
- Privacy: 确认前不暴露完整电话
- Reliability: Docker Compose 一键基础设施
- API: 统一 `{ code, message, data }`
