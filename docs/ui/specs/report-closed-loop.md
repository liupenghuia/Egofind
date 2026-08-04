---
id: UI-20260728-004
title: 举报闭环—小程序提交与管理处理
status: Approved
target: both
related_task: TASK-20260728-004
related_pages:
  - mini-app/src/pages/report/index.tsx
  - mini-app/src/pages/detail/index.tsx
  - mini-app/src/pages/list/index.tsx
  - admin-web/src/pages/Reports.tsx
mode_scope: both
created: 2026-07-28
updated: 2026-07-28
approved_by: pipeline
---

# UI Spec — 举报闭环

## 1. 小程序入口

| 位置 | 动作 |
| --- | --- |
| 行程详情 | 「举报」次要按钮 |
| 匹配单卡片 | 「举报」 |
| 举报页 | 原因单选 + 说明 + 提交 |

## 2. 举报页

```text
标题：举报
说明：我们会尽快处理，请勿提交虚假信息
原因：骚扰 / 欺诈虚假 / 人身安全 / 言语不当 / 其他
说明：选填 ≤500
[提交举报]
成功：Toast 后返回
```

## 3. 管理端

```text
侧栏：举报管理
表格：时间、类型、目标 ID、原因、详情、举报人、状态
操作：标记处理中 / 关闭（备注）/ 禁用被举报用户（若有 targetUserId）
```

## 4. 验收

- [x] 用户可达提交
- [x] 管理端可处理关闭
- [x] 无拨号/电话泄露
