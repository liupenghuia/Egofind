# UI 设计真相源

| 路径 | 用途 |
| --- | --- |
| [design-system.md](./design-system.md) | 全局 tokens、双模式、通用组件与业务 UI 约束 |
| [specs/](./specs/) | 按功能/页面的 UI Spec |
| [specs/_template.md](./specs/_template.md) | 新建 Spec 模板 |
| [../roles/ui-design.md](../roles/ui-design.md) | UI/UX Design Agent 职责 |

## 命令

**产品一键流水线（推荐）：**

```text
顺序完成：

[需求描述]
```

自动：Product → UI Design（有界面时）→ Architect → 开发 → 测试。见 `docs/delivery-pipeline.md`。

**单相位：**

```text
UI设计 <功能或页面>
小程序 <功能或页面>    # 单跑时：Spec 确认后再实现
```

详见根目录 `COMMANDS.md`。

## 状态约定（Spec front matter）

| status | 含义 |
| --- | --- |
| `Draft` | 撰写中 |
| `Ready for Review` | 待用户确认 |
| `Approved` | 用户已确认，可实现 |
| `Superseded` | 被新版本替代，保留备查 |
