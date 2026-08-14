---
id: UI-20260813-001
title: 小程序全站 Token 落地一致性重构
status: Approved
target: miniprogram
related_task: null
related_pages:
  - mini-app/src/pages/index/index.tsx
  - mini-app/src/pages/map/index.tsx
  - mini-app/src/pages/detail/index.tsx
  - mini-app/src/pages/list/index.tsx
  - mini-app/src/pages/login/index.tsx
  - mini-app/src/pages/mine/index.tsx
  - mini-app/src/pages/publish-driver/index.tsx
  - mini-app/src/pages/publish-passenger/index.tsx
  - mini-app/src/pages/match-candidates/index.tsx
  - mini-app/src/pages/match-detail/index.tsx
  - mini-app/src/pages/driver-verify/index.tsx
  - mini-app/src/pages/feedback/index.tsx
  - mini-app/src/pages/report/index.tsx
  - mini-app/src/pages/review/index.tsx
  - mini-app/src/pages/notifications/index.tsx
  - mini-app/src/pages/legal/index.tsx
  - mini-app/src/styles/common.scss
  - mini-app/src/styles/tokens.scss
mode_scope: both
created: 2026-08-13
updated: 2026-08-13
approved_by: user
---

# UI Spec — 小程序全站 Token 落地一致性重构

## 1. 目标与约束

- **用户目标：** 任意页面第一眼视觉统一、可信、符合顺风车产品直觉；价格/座位/时间/主操作按钮权重清晰；空/加载/错误态不生硬。
- **业务约束：** 不改变任何业务规则、接口、状态机、信息架构、已批准 Spec 的版式语义；不引入新组件库（不装 Vant/vantui 等）；不新增页面/功能；不涉及支付（产品非目标，见 `docs/requirements.md`）。
- **不在范围：** `admin-web`（视觉已在 U3 阶段覆盖，见 `experience-u3-visual.md`）；新 token 语义（除非现状确实缺失，需同步补 `design-system.md` 并在本 Spec 记录）。

## 2. 现状审查结论

审查 16 个 `mini-app/src/pages/*` 页面 + `styles/common.scss` + `styles/tokens.scss`：

| 问题 | 范围 | 说明 |
| --- | --- | --- |
| 仅 2/16 页面有同目录 `.scss`（`index/`、`map/`） | 结构性 | 其余 14 页全靠内联 `style={{}}`，SCSS token 在 JS 运行时不可达，只能手写数值 |
| 59 处内联 hex 色值 | `detail`、`match-candidates`、`feedback`、`driver-verify`、`review`、`list`、`mine`、`publish-*` 等 | 多数值落在色板内但硬编码；`feedback/index.tsx` 出现 `#666`/`#333`，色板里没有这两个值 |
| 字号跑出阶梯 | `feedback/index.tsx`（26）、`match-candidates/index.tsx`（20） | 设计系统只定义 22/24/28/32/36/40 |
| 卡片未复用 `.eg-card` | `feedback`、`detail`、`match-candidates`、`report` 部分区块 | 各自内联 `background:'#fff'` 仿卡片 |
| 空态未复用 `EmptyState` | `index`、`map` | 手写空文案，样式与 `list`/`match-candidates`/`notifications` 不一致 |
| 按钮未全部使用 `.eg-btn-*` | 多页面部分次要按钮 | 主按钮基本已用，次要/危险按钮不少是裸 `<Button>` |

## 3. 技术方案（本 Spec 的核心决策）

1. **Token 单一源不变**：仍是 `mini-app/src/styles/tokens.scss` + `docs/ui/design-system.md`；不新建 JS/TS 镜像文件，避免双源漂移，也不引入生成工具链（新依赖）。
2. **补齐 page-scoped scss**：14 个缺 `.scss` 的页面各补一个同目录 `index.scss`，`@use '../../styles/tokens.scss' as *;`，用法对齐现有 `map/index.scss` 样板。内联 `style={{}}` 中的静态样式（背景、圆角、间距、字号、非动态颜色）迁移为 `className`。
3. **动态样式用修饰类，不用内联 hex**：颜色随运行时状态变化的场景（如满员/未满员、认证状态），改为条件 `className` 切换修饰类（如 `status--danger` / `status--success`），修饰类在页面 scss 里引用 token；不新增任何"JS 里也存一份颜色值"的机制。
4. **命名规范**：`块__元素--修饰符`，延续现有 `trip-sheet__price`、`eg-empty__title` 写法；页面级类名前缀用页面名（如 `detail__price`、`feedback__reason-btn`）避免语义混淆。
5. **最大化复用现有全局资产**：`.eg-card`、`.eg-btn-primary/secondary/danger-text`、`.eg-banner-warn/danger/info`、`EmptyState`/`ErrorState`/`LoadingBlock` 组件——凡是场景匹配的一律换成复用，禁止页面私建重复实现。
6. **越界数值归位到最近 token**：`fontSize:26`→`$font-md(28px)`；`fontSize:20`→`$font-xs(22px)`；`#666`→`$color-text-secondary`；`#333`→`$color-text-primary`。若审查中出现现有 token 确实覆盖不到的语义，记录在本节并同步补 `tokens.scss` + `design-system.md`（预期不需要，当前审查未发现真实缺口）。
7. **格式化**：沿用根 `.prettierrc`（单引号、分号、2 空格、100 列、trailing comma）。
8. **补充：全局工具类**（审查过程中确认必要，已加入 `common.scss`）：间距 `mt-xs/sm/md/lg/xl`、`mb-xs/sm/md`，文字色 `text-brand/driver/success/warning/danger/secondary/primary`，字号 `fs-xs/sm/lg/xl/xxl`，`fw-600`。这些是对现有 `eg-*` 语义类的补充，不是新组件库；用于替换页面里大量一次性的 `style={{ marginTop: N, color: '#xxx' }}`，避免每个页面各写一份雷同的私有类。页面级 scss 只保留真正独特的组合（动态状态色、固定定位、渐变等）。
9. **共享组件顺带修复**：审查发现 `ErrorState.tsx`（`fontSize:30` 不在阶梯 + 硬编码 `#ff4d4f`）与 `EmptyState.tsx`（内联 `marginTop:24`）本身不合规，已用 `common.scss` 新增的 `.eg-empty__title--danger` / `.eg-empty__action` 修复，影响全站所有引用这两个组件的页面。

## 4. 页面改动清单

| 页面 | 计划改动 |
| --- | --- |
| `index/index.tsx` | 补 `index.scss`；空态换 `EmptyState`（若适用） |
| `map/index.tsx` | 已有 scss，检查 `trip-sheet` 系列是否有残留内联值 |
| `detail/index.tsx` | 补 scss；卡片换 `.eg-card`；状态色（满员/可接）换修饰类；价格色/合规文案样式迁移 |
| `list/index.tsx` | 补 scss；状态色迁移；已用 `EmptyState` 保留 |
| `login/index.tsx` | 补 scss（如有内联样式） |
| `mine/index.tsx` | 补 scss；输入框背景对齐 `$color-bg-muted` |
| `publish-driver/index.tsx` | 补 scss；表单输入背景/圆角对齐 token |
| `publish-passenger/index.tsx` | 同上 |
| `match-candidates/index.tsx` | 补 scss；卡片换 `.eg-card`；`fontSize:20` 归位；价格/评分/状态色迁移 |
| `match-detail/index.tsx` | 补 scss |
| `driver-verify/index.tsx` | 补 scss；状态色（通过/驳回/审核中）换修饰类；表单输入背景对齐 |
| `feedback/index.tsx` | 补 scss；`#666`/`#333`/`fontSize:26` 归位；卡片换 `.eg-card`；单选按钮换修饰类 |
| `report/index.tsx` | 补 scss；卡片换 `.eg-card` |
| `review/index.tsx` | 补 scss；评分色迁移 |
| `notifications/index.tsx` | 已用 `EmptyState`，检查内联残留 |
| `legal/index.tsx` | 补 scss（如有内联样式） |

## 5. 状态矩阵（全站基线，逐页核对是否落实）

| 状态 | 表现 | 复用 |
| --- | --- | --- |
| loading | 首屏居中/列表骨架，不空白闪 | `LoadingBlock` |
| empty | 一句原因 + 一个主行动 | `EmptyState` |
| error | 可读原因 + 重试 | `ErrorState` |
| 状态色（满员/待审/已通过等） | 修饰类，不内联 hex | 页面 scss + token |

## 6. Tokens 使用

- 不新增 token 语义；全部复用 `tokens.scss` 已有色板/字号/间距/圆角/阴影。
- 越界值归位规则见 §3.6。

## 7. UI 验收（可观察）

- [x] `mini-app/src/pages/*` 下不再有内联 hex 颜色（`grep -rE "#[0-9a-fA-F]{3,6}" pages components` 结果仅剩 `login` 页 `Checkbox` 组件的 `color` prop——原生组件属性非 CSS，无法走 className，予以保留）
- [x] 字号/间距/圆角内联数值均落在 tokens 阶梯上（或已迁移为 className）；越界值按 §3.6 归位
- [x] 空态页面统一走 `EmptyState`；加载统一走 `LoadingBlock`；错误统一走 `ErrorState`
- [x] 卡片场景统一 `.eg-card`；主/次/危险按钮统一 `.eg-btn-*`
- [x] `tsc --noEmit` 无新增类型错误（与改动前基线对比，仅剩 3 条改动前已存在的 `map` 页错误：图片资源类型声明、`onError` 缺失）

## 12. 实施记录（本轮实际改动）

- 16 个页面全部过了一遍；9 个页面新建同目录 `index.scss`（`detail`/`driver-verify`/`feedback`/`login`/`legal`/`notifications`/`publish-driver`/`report`），其余复用全局类无需页面 scss。
- `common.scss` 新增：间距工具类 `mt-*`/`mb-*`/`ml-*`、文字色工具类 `text-*`、字号工具类 `fs-*`、字重 `fw-*`、`eg-row-between`、`eg-picker-row`/`eg-picker-option`、`eg-input`（统一输入框背景/内边距/圆角，替换各页各写一份的 `#f5f6f8` + 8px 圆角）、`btn-auto`、`star-rating` 系列、`eg-empty__title--danger`/`eg-empty__action`。
- 顺带修复的真实缺陷（非本 Spec 原计划，审查中发现即修）：
  - `ErrorState.tsx`/`EmptyState.tsx` 自身有越界字号与硬编码 hex，已修复（影响全站所有引用页）。
  - `map/index.tsx` 此前从未加载 `common.scss`（因未使用 `PageShell`），导致该页 `eg-btn-primary` 等 class **实际未生效**；已补 `import '../../styles/common.scss'`。
  - `feedback`、`map`（trip-sheet 按钮）两处用了 weapp 原生 `type="primary"`/`type="warn"`，渲染成微信默认配色而非 app 品牌色；已改为 `eg-btn-primary`。
  - `StarRating.tsx`、`SegmentTabs.tsx` 两个共享组件自身也有内联 hex/魔法间距，一并修复。
- 已知遗留：`match-candidates/index.scss` 原为该页专用样式文件，规则迁移进 `common.scss` 后文件应删除，但当前会话没有删除文件权限，已清空为 0 字节，需要人工删除该文件。

## 8. Out of scope / 开放问题

- `admin-web` 视觉一致性（已在 U3 覆盖，未发现新增问题不重复处理）
- 不引入 Vant Weapp / `@antmjs/vantui` 等组件库
- 不做真机/DevTools 视觉签核（人闸，需用户自查）

## 9. 交接

- **实现 owner：** 本轮直接落地（用户已跳过独立确认环节，见对话记录）
- **Spec 路径：** `docs/ui/specs/design-token-consistency.md`
