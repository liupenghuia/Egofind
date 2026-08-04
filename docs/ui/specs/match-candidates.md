---
id: UI-20260728-003
title: 匹配候选列表—为你推荐
status: Approved
target: miniprogram
related_task: TASK-20260728-003
related_pages:
  - mini-app/src/pages/match-candidates/index.tsx
  - mini-app/src/pages/index/index.tsx
  - mini-app/src/pages/list/index.tsx
mode_scope: both
created: 2026-07-28
updated: 2026-07-28
approved_by: pipeline
---

# UI Spec — 匹配候选列表

## 1. 入口

| 从 | 动作 |
| --- | --- |
| 首页 | 「为你推荐」 |
| 我的发布卡片 | 「看匹配」 |

## 2. 页面结构

```text
顶栏：为你推荐 · 乘客/司机
锚点：当前使用的人找车/车找人路线摘要
列表（按 score 降序）：
  路线 · 匹配度 xx · 约 d km
  时间 · 余座/人数 · 有价则价格
  [查看详情]
空：附近暂无匹配 / 请先发布
加载 / 失败重试
```

## 3. 约束

- 司机列表只读，无拨号
- 乘客详情确认仍走 detail 既有流

## 4. 验收

- [x] 有开放单时展示排序列表
- [x] 无开放单引导发布
- [x] 空/错状态可读
