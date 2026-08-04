# 文档地图（EGoFind）

> **用途：** 按「产品 / 接口与架构 / Agent 交付 / UI / 业务域 / 任务证据」分门别类。  
> **原则：** 真相源不重复写两遍；kit 路径（`product.yaml` → `truths.*`）**不改路径**，内容可整合后用短链兼容。  
> **Agent 总入口：** 根目录 [`CLAUDE.md`](../CLAUDE.md)（已合并原 AGENTS + COMMANDS + 产品经理准则）。

---

## 0. 先读谁（按角色）

| 你要… | 先读 | 再读 |
| --- | --- | --- |
| **下次续作 / 还差什么** | **[`NEXT.md`](./NEXT.md)** | 对应 U3/U4 条目 |
| 任意会话启动 | [`CLAUDE.md`](../CLAUDE.md) | `product.yaml` + **`NEXT.md`** |
| 产品目标 / 功能边界 | [`requirements.md`](./requirements.md) | [`product-design.md`](./product-design.md) |
| 写/审需求、取舍 | `CLAUDE.md` §2 产品经理 | `product-request-template.md` |
| 接口契约 | [`openapi.yaml`](./openapi.yaml) | 实现代码 |
| 数据模型 | [`database.md`](./database.md) | `backend/prisma/schema.prisma` |
| 系统/客户端架构 | [`architecture.md`](./architecture.md) | [`client-architecture.md`](./client-architecture.md) |
| 落码质量 | [`code-quality-prerequisites.md`](./code-quality-prerequisites.md) | — |
| `顺序完成` / `交付` | [`delivery-pipeline.md`](./delivery-pipeline.md) | [`delivery-workflow.md`](./delivery-workflow.md) |
| UI 实现 | [`ui/design-system.md`](./ui/design-system.md) | 对应 `ui/specs/*` |
| 业务规则（额度/区县） | [`domain-rules.md`](./domain-rules.md) | — |
| 微信配置 | [`wechat-setup.md`](./wechat-setup.md) | — |
| 测试策略 | [`testing.md`](./testing.md) | — |

---

## 1. 分类总表

### A. Agent 入口与契约（根目录）

| 文件 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| **`CLAUDE.md`** | **唯一总入口**：指令优先级、产品经理准则、code-first、流水线、短命令、修到绿 | 已合并 AGENTS+COMMANDS | 改规则只改这里 |
| `AGENTS.md` | 兼容跳转 → CLAUDE.md | 短链，勿扩写 | 包内 `*/AGENTS.md` 仍独立 |
| `COMMANDS.md` | 兼容跳转 → CLAUDE.md §7 | 短链，勿扩写 | 别名仍可在 product.yaml |
| `README.md` | 人读：启动、API 摘要、待办 | 保留 | 与 requirements 有少量重复属正常 |

### B. 产品真相（目标、范围、行为）

| 文件 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| **`requirements.md`** | **短真相**：目标、用户、能力、Active slice、非目标 | 保留精简 | `truths.requirements`；交付进度以 task 为准 |
| **`NEXT.md`** | **续作清单**（U3/U4 暂停待办；会话开头提醒） | 新建 | 完成请勾选并同步 requirements |
| **`product-design.md`** | **长基线**：定位、原则、流程、匹配算法、模型纲要、安全 | 保留独立 | 勿与 requirements 全文重复；改行为先改此处再同步 requirements 一句 |
| `product-discovery.md` | Idea → Brief 方法论 | 保留（kit 流程） | `truths.discovery`；日常 MVP 少用 |
| `product-request-template.md` | 非技术提需求话术 | 保留 | 产品负责人入口模板 |
| `ideas/template.md` | Idea 文件模板 | 保留 | 无业务内容 |

**为何不合成一个：**  
- `requirements` 要短、常改「当前切片」；  
- `product-design` 要长、稳定作设计基线；  
- kit/`truths` 分字段引用。合并会破坏导航与 diff 可读性。

### C. 接口与架构（实现边界）

| 文件 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| **`openapi.yaml`** | HTTP 契约（若滞后以代码+Swagger 为准） | 独立 | 机器可读；改 API 应同步 |
| **`database.md`** | 表/关系摘要 | 独立 | 细节以 `schema.prisma` 为准 |
| **`architecture.md`** | 系统边界索引 + 决策入口 | **已充实为索引**（非空模板） | `truths.architecture`；细节外链 design/openapi/db |
| **`client-architecture.md`** | 客户端分层与落码前检查 | 保留 | 小程序/Web 必读；勿塞进 openapi |
| `backend|mini-app|admin-web/README.md` | 包级启动 | 保留 | 工程向 |

**为何不把 client 并入 architecture：**  
客户端 precheck 清单被 delivery 引用；合并后 Architect/Frontend 边界变糊。

### D. 业务域规则（跨接口的产品规则）

| 文件 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| **`domain-rules.md`** | **域规则合集**（反馈额度、adcode/匹配区） | **新整合** | 单一入口查规则 |
| `driver-feedback-quota.md` | → 跳转 domain-rules | 短链 | 旧链兼容 |
| `map-adcode.md` | → 跳转 domain-rules | 短链 | 旧链兼容 |

### E. Agent 交付与质量（流程）

| 文件 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| **`delivery-pipeline.md`** | `顺序完成` 相位自动串链 | 保留 | Orchestrator 主读 |
| **`delivery-workflow.md`** | task/issue 状态机、门禁、DoD | 保留 | 与 pipeline **互补**：一个讲顺序，一个讲状态 |
| **`code-quality-prerequisites.md`** | 落码前质量 + **迭代纪律**（已并入 iterative） | **已吸收 iterative** | `truths.quality` |
| `iterative-implementation-guidelines.md` | → 跳转 quality | 短链 | 避免双源 |
| `testing.md` | 测试策略 / Test Agent | 保留 | `truths.testing` |
| `roles/orchestrator.md` | 编排职责摘要 | 保留 | 细节见 pipeline + CLAUDE |
| `roles/ui-design.md` | UI 角色职责 | 保留 | 与 design-system 分工：角色 vs 视觉 |
| `.grok/skills/*` | 技能触发说明 | 保留 | 工具层，非产品真相 |

**为何 pipeline ≠ workflow 不合：**  
- Pipeline = 一次会话怎么串角色；  
- Workflow = task front matter 合法状态与交接。  
合成易让 validator/交付语义纠缠。

### F. UI 设计

| 文件 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| `ui/design-system.md` | tokens、组件、双模式 | 保留 | 全局视觉唯一源 |
| `ui/README.md` | UI 区索引 | **含 specs 说明** | 入口 |
| `ui/specs/_template.md` | Spec 模板 | 保留 | |
| `ui/specs/*.md` | **按功能一份** | **禁止合并成一个** | 与 task `ui_spec` 一一对应；生命周期独立 |
| `ui/specs/README.md` | → 跳转 `ui/README.md` | 短链 | |

### G. 平台与运维说明

| 文件 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| `wechat-setup.md` | AppID、隐私、DevTools | 保留 | 人闸相关，勿塞进产品设计 |

### H. 任务 / Issue / 证据（状态机载体）

| 路径 | 职责 | 整合状态 | 备注 |
| --- | --- | --- | --- |
| `tasks/TASK-*.md` | 交付单元 + front matter | **禁止合并** | 每任务独立状态；`validate_workflow` 扫描 |
| `tasks/template.md` | 模板 | 保留 | |
| `issues/*` | 缺陷/返工 | 禁止合并 | 当前多仅 template |
| `/tmp/agent-delivery/EGoFind/` | runner 证据 | 不入库 | 见 product.yaml `evidence_root` |

### I. 包级 Agent 收紧（实现角色）

| 文件 | 职责 | 备注 |
| --- | --- | --- |
| `backend/AGENTS.md` | 后端边界 | 指向 CLAUDE + openapi/db |
| `mini-app/AGENTS.md` | 小程序边界 | Spec + design-system |
| `admin-web/AGENTS.md` | 管理端边界 | |
| `tests/AGENTS.md` | 测试边界 | |
| `docs/AGENTS.md` | docs 所有权一句 | 见本文 |

---

## 2. 与 `product.yaml` truths 对齐

| truths key | 路径 | 说明 |
| --- | --- | --- |
| requirements | `docs/requirements.md` | 短产品行为 + Active slice |
| architecture | `docs/architecture.md` | 索引型架构说明 |
| openapi | `docs/openapi.yaml` | |
| database | `docs/database.md` | |
| discovery | `docs/product-discovery.md` | |
| client_architecture | `docs/client-architecture.md` | |
| testing | `docs/testing.md` | |
| quality | `docs/code-quality-prerequisites.md` | |
| workflow | `docs/delivery-workflow.md` | |
| ui_design_system | `docs/ui/design-system.md` | |
| ui_design_role | `docs/roles/ui-design.md` | |
| delivery_pipeline | `docs/delivery-pipeline.md` | |
| orchestrator_role | `docs/roles/orchestrator.md` | |

**未进 truths 但重要：** `CLAUDE.md`、`product-design.md`、`domain-rules.md`、`wechat-setup.md`、各 UI Spec。

---

## 3. 整合决策摘要（本次）

| 动作 | 结果 |
| --- | --- |
| 新建 `docs/README.md` | 本文：分类 + 先读谁 + 备注 |
| 新建 `docs/domain-rules.md` | 合并反馈额度 + adcode 规则 |
| 充实 `docs/architecture.md` | 从空模板变为真实索引 |
| 扩展 `code-quality-prerequisites.md` | 吸收 iterative 要点 |
| 统一 `docs/ui/README.md` | 含 Spec 索引表 |
| 短链保留旧路径 | quota / map-adcode / iterative / specs/README / AGENTS / COMMANDS |
| **未合并** | Spec 单文件、task 单文件、pipeline↔workflow、requirements↔product-design、openapi、package AGENTS |

---

## 4. 维护约定

1. **新功能：** task +（若有 UI）`ui/specs/<slug>.md`；更新 `requirements.md` Active slice 一行。  
2. **改业务规则：** 先 `domain-rules.md` 或 `product-design.md`，再改代码与 openapi。  
3. **改 Agent 行为：** 只改 `CLAUDE.md`。  
4. **禁止**再创建与 CLAUDE/requirements/product-design 平行的第三套「总说明」。  
5. OpenAPI 与实现不一致时：**以实现 + 本轮 task 为准**，并记 follow-up 同步 openapi。

---

## 5. 已知文档债（不阻塞开发）

| 项 | 说明 |
| --- | --- |
| openapi.yaml 可能滞后 | 近期接口（reviews、complete、verify/me、resolve report、notifications 扩展）需抽空对齐 |
| product-design 文内「第1步」口吻 | 历史交付语；以现状实现为准 |
| architecture 曾为空模板 | 已改为索引；深度 ADR 仍可后补 `docs/architecture/` |
| README 根「待办」与 requirements 切片 | 根 README 偏工程；产品进度以 requirements + tasks 为准 |
