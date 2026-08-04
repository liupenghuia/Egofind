---
id: UI-20260730-004
title: 体验 U3 视觉精细化
status: Approved
target: both
related_task: TASK-20260730-004
related_pages:
  - mini-app/src/pages/map/index.tsx
  - mini-app/src/styles/tokens.scss
  - mini-app/src/styles/common.scss
  - mini-app/src/components/EmptyState.tsx
  - admin-web/src/pages/Dashboard.tsx
  - admin-web/src/pages/Reports.tsx
  - admin-web/src/pages/Orders.tsx
  - admin-web/src/pages/Verifications.tsx
mode_scope: both
created: 2026-07-30
updated: 2026-07-30
approved_by: pipeline
---

# UI Spec — 体验 U3 视觉精细化

## 1. 目标与约束

- **用户目标：** 地图角色可辨；卡片/底栏统一；空态不冷；管理端待办可见。
- **业务约束：** 双模式色（brand / driver）；地图 `color-map-driver` / `color-map-passenger`；不改联系权与匹配规则。
- **不在范围：** U4 业务能力、新 API、重插画包、真机视觉签核。

## 2. 入口与导航

无新导航。增强既有地图 Tab、空态组件、管理端 Dashboard/订单/认证/举报。

## 3. 页面结构

### 3.1 地图标记（U3.1）

- 乘客模式看**车找人**：蓝标 `color-map-driver`（`#1677FF`）
- 司机模式看**人找车**：橙标 `color-map-passenger`（`#FA8C16`）
- 资源：`mini-app/src/assets/map/marker-driver.png`、`marker-passenger.png`（约 64×64，含白描边圆点）
- marker `width/height` 约 32–36；可保留 title 供无障碍

### 3.2 阴影与卡片（U3.2）

| Token | 值 | 用途 |
| --- | --- | --- |
| `$shadow-card` | `0 4px 16px rgba(0,0,0,0.04)` | `eg-card`、列表块 |
| `$shadow-sheet` | `0 -8px 32px rgba(0,0,0,0.08)` | 底栏 sheet（map 摘要等） |
| `$shadow-tab` | `0 -4px 16px rgba(0,0,0,0.04)` | 自定义 tab bar |

- map `.trip-sheet`：圆角 `radius-lg` 顶、padding `space-lg` / `space-md`，阴影用 `$shadow-sheet`
- 全站卡片统一 `$shadow-card`，禁止页面内魔法阴影

### 3.3 空态（U3.3）

- `EmptyState` 顶部：浅色圆底 + 简约符号（🚗 或「空」字标），县域工具感，不做运营大图
- 标题主色、说明 secondary；可选主按钮

### 3.4 管理端（U3.4）

**Dashboard**

| 卡片 | 含义 | 色/强调 |
| --- | --- | --- |
| 待审认证 | 待审司机认证条数 | warning 倾向 |
| 待处理举报 | OPEN+REVIEWING | danger / orange |
| 车找人 / 人找车 / 匹配单 | 既有统计 | 默认 |

**状态色**

| 状态 | Tag |
| --- | --- |
| OPEN / 待处理 | orange |
| REVIEWING / 处理中 | blue |
| CLOSED / 已关闭 | default |
| 认证 PENDING | orange |
| 认证 APPROVED | green |
| 认证 REJECTED | red |

**中文枚举（示例）**

- visibility：PUBLIC→公开，HIDDEN→隐藏
- trip/request status：OPEN→进行中，CANCELLED→已取消，COMPLETED→已完成，EXPIRED→已过期（按实际枚举映射，未知原样）
- targetType：driver_trip→车找人，passenger_request→人找车，user→用户，match_order→匹配单

## 4. 组件清单

| 组件 | 复用/新建 | 说明 |
| --- | --- | --- |
| Map markers icon | 新建资源 | 双色 PNG |
| tokens shadow | 扩展 | design-system 同步 |
| EmptyState | 增强 | 装饰区 |
| Dashboard 待办 | 增强 | 现有 API 聚合 |
| 枚举 Tag 映射 | 新建小工具或页内 map | admin-web |

## 5. 状态矩阵

| 状态 | 表现 |
| --- | --- |
| 地图有点 | 对应色 icon 聚合/点击出 sheet |
| 地图无点 | 顶栏文案 + 可选 Empty 风格提示（可不强制整页 Empty） |
| Dashboard 加载失败 | 待办显示 0 或「—」，不白屏 |
| 未知枚举 | 显示原英文码，不抛错 |

## 6. UI 验收条

1. 两种模式 marker 图标色不同且可读。
2. 卡片与 map sheet 阴影来自 token。
3. EmptyState 有装饰非纯字。
4. Dashboard 有待审认证、待处理举报数字。
5. 举报/订单/认证状态中文+色标。

## 7. Out of scope / Open

- 自定义聚合气泡、热力图
- 管理端图表库
- U4
