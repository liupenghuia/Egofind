---
id: UI-20260728-001
title: 匹配单—行程完成与互评
status: Approved
target: miniprogram
related_task: TASK-20260728-001
related_pages:
  - mini-app/src/pages/list/index.tsx
  - mini-app/src/pages/review/index.tsx
mode_scope: both
created: 2026-07-28
updated: 2026-07-28
approved_by: pipeline
---

# UI Spec — 匹配单完成与互评

## 1. 目标

- 列表「匹配单」可读、可完成、可评价。
- 评价页：1–5 星 + 可选文字。

## 2. 列表 · 匹配单卡片

```text
路线：司机行程 origin → dest
状态：已确认 / 已完成 / 已取消（中文）
副文：确认时间或座位
[行程完成]  — 仅 status=CONFIRMED
[去评价]    — status=COMPLETED 且我未评
[已评价]    — 我已提交（禁用或文案）
```

## 3. 评价页

```text
标题：评价对方
星级：1–5（必选，点选高亮）
文字：可选，最多 500 字
[提交评价] Primary
成功 Toast 后返回列表
```

## 4. 状态

| 状态 | 表现 |
| --- | --- |
| loading | 列表加载中 |
| empty matches | 「暂无匹配单」 |
| completing | 完成按钮 loading |
| review form | 星级未选禁用提交 |
| review error | Toast 具体原因 |

## 5. 文案

| 位置 | 文案 |
| --- | --- |
| 完成按钮 | 行程完成 |
| 完成成功 | 已标记完成 |
| 评价入口 | 去评价 |
| 已评 | 已评价 |
| 星级提示 | 请选择 1–5 星 |
| 提交 | 提交评价 |

## 6. UI 验收

- [x] 匹配单显示路线与中文状态（代码审查 2026-07-28）
- [x] 已确认可完成；完成后可评价
- [x] 重复评价有提示（后端 409）
- [x] 司机/乘客同一套匹配单能力（任一方完成）
