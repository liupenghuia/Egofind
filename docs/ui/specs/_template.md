---
id: UI-YYYYMMDD-NNN
title: 页面或流程名称
status: Draft
# Draft | Ready for Review | Approved | Superseded
target: miniprogram
# miniprogram | admin-web | both
related_task: null
# TASK-YYYYMMDD-NNN or null
related_pages:
  - mini-app/src/pages/...
mode_scope: both
# passenger | driver | both
created: YYYY-MM-DD
updated: YYYY-MM-DD
approved_by: null
---

# UI Spec — {{title}}

## 1. 目标与约束

- **用户目标：**
- **业务约束：**（引用 product 原则：双模式 / 非对称电话 / 可见性等）
- **不在范围：**

## 2. 入口与导航

| 从哪来 | 动作 | 到哪去 |
| --- | --- | --- |
|  |  |  |

## 3. 页面结构（自上而下）

1. **顶区：**
2. **主内容：**
3. **操作区 / 底栏：**

（可用简单线框文字表示）

```text
┌─────────────────────┐
│ 标题 / 模式切换        │
├─────────────────────┤
│ ...                 │
├─────────────────────┤
│ [主按钮]             │
└─────────────────────┘
```

## 4. 组件清单

| 组件 | 复用 / 新建 | 说明 |
| --- | --- | --- |
|  | 复用 design-system |  |

## 5. 状态矩阵

| 状态 | 表现 | 用户可做什么 |
| --- | --- | --- |
| loading |  |  |
| empty |  |  |
| error |  |  |
| success / 默认 |  |  |
| disabled |  |  |
| 权限不足 / 未登录 |  |  |

## 6. 交互说明

1. …
2. …

## 7. 文案要点

| 位置 | 文案 |
| --- | --- |
| 主按钮 |  |
| 空态 |  |
| 错误 |  |

## 8. Tokens 使用

- 主色模式：乘客 brand / 司机 driver
- 其他：列出本页用到的 token 名

## 9. UI 验收（3～5 条，可观察）

- [ ] …
- [ ] …
- [ ] …

## 10. 开放问题

- …

## 11. 交接

- **实现 owner：** Mini-App Agent（`小程序 …`）
- **Spec 路径：** `docs/ui/specs/{{slug}}.md`
- **确认后下一步：** 按本 Spec 实现，不改布局语义；偏差先回更新 Spec
