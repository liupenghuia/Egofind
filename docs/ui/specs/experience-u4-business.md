---
id: UI-20260730-005
title: 体验 U4 业务补全
status: Approved
target: miniprogram
related_task: TASK-20260730-005
related_pages:
  - mini-app/src/pages/match-detail/index.tsx
  - mini-app/src/pages/detail/index.tsx
  - mini-app/src/pages/match-candidates/index.tsx
  - mini-app/src/pages/publish-driver/index.tsx
  - mini-app/src/pages/publish-passenger/index.tsx
  - mini-app/src/pages/driver-verify/index.tsx
  - mini-app/src/pages/mine/index.tsx
mode_scope: both
created: 2026-07-30
updated: 2026-07-30
approved_by: pipeline
---

# UI Spec — 体验 U4 业务补全

## 1. 目标与约束

- **用户目标：** 能取消已确认同行；发单/确认前补手机；看推荐时能信星级；认证可上传证件图。
- **业务约束：** 单方取消即生效（电话协商后）；非对称电话不变；证件图仅审核用。
- **不在范围：** 双确认取消协议、云 OSS、管理端改版。

## 2. 匹配详情 — 取消同行（U4.1）

- 状态 `CONFIRMED`：显示次要危险操作「取消同行」
- 点击 → `confirmDanger`：标题「取消本次同行？」；文案说明座位将退回、对方会收到通知
- 成功 Toast「已取消」并刷新；状态变「已取消」；隐藏完成/电话主按钮
- 状态 `CANCELLED`：只读说明 + 举报仍可用

## 3. 绑手机引导（U4.2）

- 确认同行前 / 发布车找人 / 发布人找车：若本地 `phoneMask` 为空 → Modal「请先绑定手机号」→ 去「我的」
- 服务端拒绝时同样引导（错误文案含手机/绑定）

## 4. 推荐列表星级（U4.3）

- 乘客看车找人：卡片副文案 `★ 4.8（12）` 或 `暂无评价`
- 司机看人找车：同样展示乘客侧摘要（若有）
- 用次级字色；不阻挡主 CTA

## 5. 认证上传（U4.4）

- 「驾驶证/行驶证照片」：选图按钮 + 缩略预览 + 清除
- 上传中 loading；失败可重试
- 去掉「仅粘贴 URL」为主路径（可保留高级折叠，非必须）
- 提交时带 `licenseImg` URL（上传返回）

## 6. UI 验收

1. CONFIRMED 可取消并刷新状态  
2. 无手机时发单/确认被拦住并引导  
3. 列表有星级或「暂无评价」  
4. 认证页能选图上传并提交  
