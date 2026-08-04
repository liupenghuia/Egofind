---
id: UI-20260729-001
title: 合规协议入口与发布取消
status: Approved
target: miniprogram
related_task: TASK-20260729-001
related_pages:
  - mini-app/src/pages/legal/index.tsx
  - mini-app/src/pages/login/index.tsx
  - mini-app/src/pages/mine/index.tsx
  - mini-app/src/pages/list/index.tsx
mode_scope: both
created: 2026-07-29
updated: 2026-07-29
approved_by: pipeline
---

# UI Spec — 合规协议与取消

## 登录

- 勾选：「我已阅读并同意《用户协议》与《平台服务说明》」
- 未勾选点登录 → Toast 提示
- 文案链接触发协议页（type 可选）

## 协议页

分节：用户协议摘要、隐私与电话、平台定位（信息撮合非承运）、安全提示（确认后联系、可举报）

## 列表取消

- 状态为发布中/匹配中：显示「取消发布」
- 二次确认 Modal
- 成功后刷新；状态显示已取消

## 验收

- [x] 协议可达、登录门禁
- [x] 取消发布可用
