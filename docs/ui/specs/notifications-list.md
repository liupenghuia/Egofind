---
id: UI-20260728-005
title: 站内通知列表
status: Approved
target: miniprogram
related_task: TASK-20260728-005
related_pages:
  - mini-app/src/pages/notifications/index.tsx
  - mini-app/src/pages/mine/index.tsx
  - mini-app/src/pages/index/index.tsx
mode_scope: both
created: 2026-07-28
updated: 2026-07-28
approved_by: pipeline
---

# UI Spec — 站内通知

## 入口

- 我的：「消息通知」+ 未读角标文案
- 首页可选次要入口

## 列表

```text
顶栏：消息  [全部已读]
卡片：标题 / 正文 / 时间
未读：左侧色条或加粗
空：暂无消息
```

## 验收

- [x] 有入口与未读提示
- [x] 已读/全部已读
- [x] 空态
