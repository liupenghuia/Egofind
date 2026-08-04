# UI 设计真相源

| 路径 | 用途 |
| --- | --- |
| [design-system.md](./design-system.md) | 全局 tokens、双模式、通用组件与业务 UI 约束 |
| [specs/](./specs/) | **按功能一份** UI Spec（禁止合成单文件） |
| [specs/_template.md](./specs/_template.md) | 新建 Spec 模板 |
| [../roles/ui-design.md](../roles/ui-design.md) | UI/UX Design Agent 职责 |
| [../README.md](../README.md) | 全库文档地图 |

## Spec 索引（当前）

| Spec | Task | 状态备注 |
| --- | --- | --- |
| [map-driver-summary-confirm-call](./specs/map-driver-summary-confirm-call.md) | TASK-20260720-001 | Approved；地图摘要+确认后电话 |
| [match-complete-review](./specs/match-complete-review.md) | TASK-20260728-001 | Approved；完成+互评 |
| [driver-verification](./specs/driver-verification.md) | TASK-20260728-002 | Approved；司机认证 |
| [match-candidates](./specs/match-candidates.md) | TASK-20260728-003 | Approved；为你推荐 |
| [report-closed-loop](./specs/report-closed-loop.md) | TASK-20260728-004 | Approved；举报闭环 |
| [notifications-list](./specs/notifications-list.md) | TASK-20260728-005 | Approved；站内通知 |
| [legal-and-cancel](./specs/legal-and-cancel.md) | TASK-20260729-001 | Approved；合规协议+取消 |

## 命令

```text
顺序完成：…     # 自动含 UI Design（有界面时）
UI设计 <功能>
小程序 <功能>   # Spec Approved 后实现
```

详见根 [`CLAUDE.md`](../../CLAUDE.md) §7。

## Spec 状态

| status | 含义 |
| --- | --- |
| `Draft` | 撰写中 |
| `Ready for Review` | 待确认 |
| `Approved` | 可实现（用户或 pipeline） |
| `Superseded` | 被替代，保留备查 |

## 命名

- kebab-case，尽量与页面/流程对应  
- 一文件一主流程；`related_pages` 列关联实现路径  
- task front matter `ui_spec` 指向本目录文件  
