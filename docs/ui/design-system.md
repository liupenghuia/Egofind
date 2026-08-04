# EGoFind UI Design System（小程序）

> **真相源**：本文件 + `docs/ui/specs/*`。实现侧应对齐 token 语义，避免页面内魔法色值。  
> **技术**：Taro 4 · `designWidth: 750` · 尺寸单位用 **rpx**（文档中写 rpx；SCSS 里可按项目约定写 px 由 Taro 转换）。  
> **范围**：`mini-app/` 优先；管理后台另见 Ant Design，不强制同一套 token。

---

## 1. 产品视觉定位

| 关键词 | 含义 |
| --- | --- |
| 县域可信 | 干净、清楚、偏工具型，不做花哨运营风 |
| 双模式 | 乘客 / 司机切换一眼可辨，不靠大段文案 |
| 安全默认 | 电话、确认同行、隐藏需求有明确层级，不误触 |

**品牌名**：Yi Go Find / egofind（界面短文案可用「找同行」类中性表述，避免「网约车派单」用语）。

---

## 2. Design Tokens

### 2.1 颜色

| Token | 值 | 用途 |
| --- | --- | --- |
| `color-bg-page` | `#F5F6F8` | 页面背景 |
| `color-bg-card` | `#FFFFFF` | 卡片 / 表单面 |
| `color-bg-muted` | `#EEF0F3` | 次级块、禁用底 |
| `color-text-primary` | `#1F1F1F` | 主文案 |
| `color-text-secondary` | `#8C8C8C` | 辅助说明 |
| `color-text-inverse` | `#FFFFFF` | 主按钮字色 |
| `color-border` | `#E5E6EB` | 分割线、描边 |
| `color-brand` | `#1677FF` | 主操作（偏工具蓝，可信） |
| `color-brand-soft` | `#E6F4FF` | 选中浅底、乘客强调 |
| `color-driver` | `#0B6E4F` | 司机模式强调（深绿） |
| `color-driver-soft` | `#E6F6EF` | 司机浅底 |
| `color-success` | `#52C41A` | 成功 / 已确认 |
| `color-warning` | `#FAAD14` | 警告 / 待处理 |
| `color-danger` | `#FF4D4F` | 错误 / 取消 / 危险 |
| `color-map-driver` | `#1677FF` | 地图：车找人标记 |
| `color-map-passenger` | `#FA8C16` | 地图：人找车标记 |

**模式色规则**

- 乘客模式：主按钮与顶栏强调用 `color-brand`
- 司机模式：主按钮与顶栏强调用 `color-driver`
- 切换控件同时展示两种模式；当前模式用对应 soft 底 + 主色字

### 2.2 字体（字号参考 750 稿）

| Token | 字号 | 用途 |
| --- | --- | --- |
| `font-xs` | 22rpx | 角标、辅助 |
| `font-sm` | 24rpx | 次要说明 |
| `font-md` | 28rpx | 正文默认 |
| `font-lg` | 32rpx | 小标题、列表主行 |
| `font-xl` | 36rpx | 页标题 |
| `font-xxl` | 40rpx | 少用：金额、关键数字 |

字重：正文 Regular；标题 / 主按钮 Medium–Semibold。单行截断用省略号；关键操作文案不截断。

### 2.3 间距与圆角

| Token | 值 | 用途 |
| --- | --- | --- |
| `space-xs` | 8rpx | 紧凑 |
| `space-sm` | 16rpx | 控件内边距 |
| `space-md` | 24rpx | 区块内 |
| `space-lg` | 32rpx | 页面左右边距 |
| `space-xl` | 48rpx | 大分段 |
| `radius-sm` | 8rpx | 小标签 |
| `radius-md` | 16rpx | 按钮、输入 |
| `radius-lg` | 24rpx | 卡片 |
| `radius-pill` | 999rpx | 模式切换 pill |

页面左右默认 `space-lg`；卡片间距 `space-md`。

### 2.4 阴影（层级）

| Token | 值 | 用途 |
| --- | --- | --- |
| `shadow-card` | `0 4px 16px rgba(0,0,0,0.04)` | 卡片、列表块 |
| `shadow-sheet` | `0 -8px 32px rgba(0,0,0,0.08)` | 底部 Sheet |
| `shadow-tab` | `0 -4px 16px rgba(0,0,0,0.04)` | 自定义 TabBar |

地图车找人 / 人找车标记色见 §2.1 `color-map-*`。

### 2.5 触控与安全

- 可点区域最小约 **88rpx** 高（约 44pt）
- 主按钮全宽或底部固定栏时，注意底部安全区（home indicator）
- 危险操作（取消行程、确认同行）避免与主浏览手势冲突；确认同行需明确主按钮，不与「返回」同视觉权重

---

## 3. 双模式（乘客 / 司机）

| 元素 | 乘客 | 司机 |
| --- | --- | --- |
| 顶栏/Segment 选中 | brand + brand-soft | driver + driver-soft |
| 主 CTA 文案示例 | 发布人找车 / 确认同行 | 发布车找人 / 查看匹配 |
| 地图数据 | 看车找人标记 | 看公开人找车标记 |
| 电话入口 | 确认后可出现 | **永不**提供拨号主入口 |

模式切换：**本地 UI 状态优先**；发单/敏感操作仍以服务端角色与认证为准。未认证司机点发车：引导认证，不假装成功。

---

## 4. 通用组件约定

### 4.1 按钮

| 变体 | 样式 | 场景 |
| --- | --- | --- |
| Primary | 实心 brand/driver | 主路径 |
| Secondary | 白底描边 | 次要 |
| Danger | 实心/描边 danger | 取消、拒绝类 |
| Text | 无底 | 次级链接 |
| Disabled | muted 底 + secondary 字 | 校验未过、额度用尽 |

加载中：按钮内 loading，防重复提交。

### 4.2 卡片

白底、`radius-lg`、轻分割或极弱阴影；内边距 `space-md`。列表卡片可点区域整卡可点，右侧可有次要操作。

### 4.3 表单

- 标签在上或左对齐统一全 app（推荐标签在上）
- 必填用文案或 `*`，错误在字段下红字 `font-sm`
- 地图选点：展示地点名 + 可再选；不要只显示经纬度

### 4.4 空 / 加载 / 错误

| 状态 | 表现 |
| --- | --- |
| Loading | 首屏居中或列表骨架，不空白闪 |
| Empty | 一句原因 + 一个主行动（去发布 / 刷新） |
| Error | 可读原因 + 重试；不暴露内部堆栈 |
| Offline | 提示网络异常 + 重试 |

### 4.5 导航

- Tab/页面：首页（模式+入口）、地图、列表/我的发布、我的
- 详情、发布、反馈等为子页，左上返回
- 标题简短（≤ 8 个汉字为宜）

---

## 5. 关键业务 UI 约束

| 场景 | UI 要求 |
| --- | --- |
| 确认同行 | 仅乘客可见主按钮；文案明确「确认后可获取联系方式」 |
| 取电话 | 授权说明短而清晰；失败可重试；成功后再拨号 |
| 隐藏需求 | 开关语义：「仅自己可见 / 不出现在司机地图」 |
| 无法同行反馈 | 原因选项清晰；司机原因额度用尽时禁用发车并说明 |
| 地图标记 | 司机/乘客用不同色；点击出摘要卡再进详情 |
| 合规 | 不出现「下单接驾」「司机已接单强制」等网约车话术 |

---

## 6. 文案语气

- 短句、动词开头（发布、确认、查看）
- 错误说明「发生了什么 + 能做什么」
- 不用恐吓式安全文案；用中性提示

---

## 7. 实现映射（给 Mini-App Agent）

| 文档 token | 建议落地 |
| --- | --- |
| 色/字/间距 | `mini-app/src/styles/tokens.scss`（若尚未建立则先建） |
| 全局 page | `mini-app/src/app.scss` 引用 tokens |
| 页面样式 | 优先 class + token；禁止散落 hex（设计系统未覆盖的一次性色需回写本文件） |

---

## 8. 变更规则

- 改 token 语义：改本文件 + 说明影响页面
- 单页布局：只改对应 `docs/ui/specs/<slug>.md`
- Spec 与 design system 冲突时：**以更新后的 design system 为准**，并修订 Spec
