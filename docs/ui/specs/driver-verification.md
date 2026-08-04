---
id: UI-20260728-002
title: 司机认证提交与状态
status: Approved
target: miniprogram
related_task: TASK-20260728-002
related_pages:
  - mini-app/src/pages/mine/index.tsx
  - mini-app/src/pages/driver-verify/index.tsx
  - mini-app/src/pages/publish-driver/index.tsx
mode_scope: driver
created: 2026-07-28
updated: 2026-07-28
approved_by: pipeline
---

# UI Spec — 司机认证

## 1. 入口

| 从 | 到 |
| --- | --- |
| 我的 → 司机认证 | 认证页 |
| 发布车找人未通过 | Modal → 去认证 |

## 2. 认证页结构

```text
状态条：未认证 / 审核中 / 已通过 / 已驳回（原因）
表单（未通过或驳回可编辑）：
  姓名 *、车牌 *、车型、颜色
  证件图链接（选填，占位说明后续上传）
  身份证号掩码（选填）
[提交认证] — PENDING/APPROVED 禁用
```

## 3. 文案

| 状态 | 文案 |
| --- | --- |
| NONE | 尚未提交司机认证 |
| PENDING | 审核中，请耐心等待 |
| APPROVED | 已通过，可发布车找人 |
| REJECTED | 未通过：{reason}，可修改后重提 |
| 提交成功 | 已提交，等待审核 |
| 发车拦截 | 请先完成司机认证 |

## 4. 验收

- [x] 我的有入口
- [x] 状态与表单禁用规则正确
- [x] 驳回可见原因
- [x] 未通过发车有引导
