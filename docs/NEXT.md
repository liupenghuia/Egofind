# 下次续作（Paused backlog）

> **状态：** 2026-07-30 起暂停体验整改，功能 MVP 可联调演示。  
> **谁读：** 人 + Agent。会话开始时应打开本文件，并**主动提醒用户**还有下列未完成项。  
> **完成一项后：** 勾选下方条目；全部完成或改方向时更新本文件与 `docs/requirements.md` Active slice。

---

## 一句话

**体验 U0～U4 已完成。** 功能 MVP + 体验整改主清单已收口；后续按真实联调/运营需求再开新切片。

---

## 已完成（勿重复开工）

| 阶段 | Task |
| --- | --- |
| U0 基线（Token / Tab / 双模式 / 首页） | `tasks/TASK-20260730-001.md` |
| U1 主路径（发布/发现/行程/匹配详情/评价） | `tasks/TASK-20260730-002.md` |
| U2 空错态 / 防呆 / 通知深链 / 协议引导 | `tasks/TASK-20260730-003.md` |
| U3 视觉精细化（地图标记 / 阴影 / 空态 / 管理端） | `tasks/TASK-20260730-004.md` |
| U4 业务补全（取消 match / 绑手机 / 星级 / 证件上传） | `tasks/TASK-20260730-005.md` |

业务主路径与安全整改 A/B/C 亦已 Done，见 `tasks/` 与 `docs/requirements.md`。

---

## 待继续

### U3 — 视觉精细化 ✅ Done（TASK-20260730-004）

### U4 — 业务补全 ✅ Done（TASK-20260730-005）

- [x] **U4.1** 协商取消 match（产品规则 + API + UI）  
- [x] **U4.2** 绑手机引导（确认前 / 发单前）  
- [x] **U4.3** 发现列表展示评价星级摘要  
- [x] **U4.4** 认证证件真上传（本地磁盘等价 OSS）  

无强制 backlog 时：按联调问题 / 真机人闸 / 运营反馈开新 task。

---

## 环境提醒（联调前建议先做）

- [ ] `backend`：`pnpm exec prisma migrate deploy`（含 `legal_and_report_audit` + `match_cancel_fields`）  
- [ ] 本地 Docker MySQL/Redis 若要用完整 API：`docker compose up -d`  
- [ ] 上传目录：`backend/uploads/`（运行时自动创建；勿提交用户文件）  

---

## 完整原始计划在哪

- 体验评审总计划（U0～U4 定义）：会话目录 `plan.md`（Grok session plan，章节「全部整改计划」）  
- 产品进度摘要：`docs/requirements.md` → Active product slice  
- 文档地图：`docs/README.md`  

---

## Agent 续作约定

1. 用户打开本仓库且意图含「继续 / 体验 / 顺序完成 / 还差什么」时：**先读本文件并复述待办**。  
2. 默认不自动开 U3/U4，除非用户明确说续作。  
3. 开工时为 U3 或 U4 建新 `tasks/TASK-*.md`，完成后勾选本文件并更新 `requirements.md`。  
