# Delivery Pipeline（顺序流水线）

产品负责人用自然语言提需求，并带上 **`顺序完成`** 或 **`交付`** 时，同一会话内的 Orchestrator 必须按本文件相位推进，**不在相位之间等待用户再喊一次角色命令**。

单独说「产品 …」只跑 Product，不会自动串后续相位。

---

## 1. 触发词

| 用户说法 | 行为 |
| --- | --- |
| `顺序完成` + 需求 / 任务名 | 跑完整可逆流水线（见下） |
| `交付` + 任务名 | 同流水线，并维护 task/issue 状态机与 handoff |
| 仅 `产品 …` / 需求描述 | **只** Product（可写 task/requirements） |
| 仅 `UI设计 …` / `架构 …` / `小程序 …` | 只跑对应单相位 |

---

## 2. 标准相位顺序

```text
① Product
    ↓  (产出：范围、用户流程、验收、required_scopes / frontend_targets、ui_spec 需求判断)
② UI Design          ← 条件启用（见 §3）
    ↓  (产出：docs/ui/specs/*.md；顺序完成下自动 Approved)
③ Architect
    ↓  (产出：架构/API/DB/安全；可吸收 UI 结构对接口的字段需求)
④ Backend            ← scopes.backend
⑤ Mini-App / Web     ← frontend_targets（依赖 ② 的 Spec + ③ 的契约）
⑥ Test
⑦ deliver.rb
⑧ Fix-to-Green       ← 会话 Agent 默认修到绿（见根 CLAUDE.md；≤ max_rounds）
```

**依赖说明**

- **UI 在架构前**：先把页面结构、状态、文案键定下来，Architect 再定 API 字段与错误码，减少「做完接口再改交互」。
- **实现在架构后**：Backend / Mini-App / Web 不得在 Architecture Gate 通过前当作 Done。
- **可并行**：仅当契约稳定后，backend 与无关前端 target 可并行；同一 target 仍串行。

---

## 3. UI Design 是否自动启动

| 条件 | UI Design |
| --- | --- |
| `frontend_targets.miniprogram: true` 或 `web: true`，且任务涉及**新页面 / 主流程 UI / 可感知交互** | **必须**自动跑 ② |
| 仅后端、仅数据修复、明确无 UI | `ui_spec: N/A`，**跳过** ② |
| 用户写「跳过 UI 设计」 | 跳过 ②，实现用 design-system 默认 |
| 用户写「UI 需我确认」 | ② 结束后 **暂停**，等用户确认再进 ③ |

顺序完成 / 交付的默认：UI Spec 写完后设为 **`Approved`**（流水线自动通过），**不**为视觉偏好中途打断。若出现产品级取舍（是否做某功能、隐私、付费），仍按 AGENTS 暂停。

---

## 4. 各相位输入 / 输出（交接物）

### ① Product

- **读**：用户原话、`docs/requirements.md`、相关 idea/task  
- **写**：task（或更新）、验收标准、`required_scopes`、`frontend_targets`、`ui_spec` 路径或 `N/A`、handoff  
- **下一相位触发**：若需 UI → ②；否则 → ③  

### ② UI Design

- **读**：① 的 task/验收/用户流程、`docs/ui/design-system.md`、`docs/roles/ui-design.md`  
- **写**：`docs/ui/specs/<slug>.md`；必要时更新 design-system；task.`ui_spec`  
- **顺序完成默认**：`status: Approved`，`approved_by: pipeline`  
- **下一相位**：③ Architect（勿停在聊天里等「小程序」命令）

### ③ Architect

- **读**：① 产品边界 + ② Spec（字段/状态/权限展示）  
- **写**：architecture / openapi / database 影响；client 边界  
- **下一相位**：按 scopes 进入 ④⑤  

### ④ Backend

- **读**：OpenAPI / DB / task  
- **写**：`backend/` + 可运行验证  

### ⑤ Mini-App / Web

- **读**：Approved Spec + OpenAPI + design-system  
- **写**：`mini-app/` 和/或 `admin-web/`  

### ⑥ Test

- **读**：验收 + Spec UI 验收条 + 实现  
- **写**：证据；失败则 issue  

### ⑦⑧ deliver + Fix-to-Green

- **跑**：`ruby scripts/deliver.rb <task>`  
- **失败**：`ruby scripts/summarize_delivery_failure.rb <task>` → 按 scope 最小修复 → 再 deliver  
- **界**：`delivery.max_rounds`；人闸/缺环境硬停；runner 绿 ≠ task Done  
- **默认 repair 主体**：当前会话 Agent（不依赖 `DELIVERY_REPAIR_COMMAND`）  

---

## 5. Orchestrator 执行规则

1. 用户触发 `顺序完成` / `交付` 后，**当前 Agent 扮演 Orchestrator**，按 §2 相位切换角色指令（读对应 role / AGENTS），连续执行。  
2. 每相位结束在 task handoff 记一行：`from → to`、产物路径、验证命令。  
3. 相位失败：记 Blocked 或建 issue，**不要跳过失败相位假装完成**。  
4. 不要求用户再说「启动 UI Agent」「启动架构」——除非 §3 规定暂停。  
5. deliver 失败后按 Fix-to-Green 自动修，**不要**停下来等人说「再修一次」。  
6. Code-first 且用户**未**说顺序完成/交付：禁止擅自跑完整流水线；但实现收尾仍应用同一 Fix-to-Green 环（有 task 时用 deliver）。  

---

## 6. 产品负责人最小指令模板

```text
顺序完成：

[用自己的话描述需求]

目标用户：…
希望用户能：…
必须现在做：…
可以以后做：…
```

可选修饰：

```text
UI 需我确认          # ② 后暂停
跳过 UI 设计         # 跳过 ②
只要小程序不要后台   # Product 设 frontend_targets
```

---

## 7. 与状态机的关系

- 流水线相位映射到 `docs/delivery-workflow.md` 的 task 状态时：  
  - ① 结束 ≈ `Ready for Architecture` 前完成 Product Gate（若含 UI，先 ②）  
  - ② 可记 `scope_status` 扩展字段或 task 正文 UI Design checklist（不强制改 validator）  
  - ③ 结束 → `Ready for Implementation`  
  - ④⑤ → `In Progress` / scopes Done  
  - ⑥ → Test 相关状态  
- 不修改 validator 的前提下，用 **task 正文 + `ui_spec` + handoff** 记录 UI 相位即可。

---

## 8. 单相位命令仍可用

调试或返工时仍可：

```text
产品 xxx
UI设计 xxx
架构 xxx
后端 xxx
小程序 xxx
Web xxx
测试 xxx
```

返工后若用户再次 `顺序完成`，从**第一个未完成相位**续跑，不重做已 Done 且无变更的相位。
