# 业务域规则（合集）

> **单一入口**查跨模块产品规则。原 `driver-feedback-quota.md`、`map-adcode.md` 已并入本文，旧路径为短链。  
> 接口细节以代码与 `openapi.yaml` 为准；冲突时以实现 + 最新 task 为准。

---

## 1. 无法同行反馈与司机原因月额度

### 规则

| 项 | 说明 |
| --- | --- |
| 场景 | 乘客查看司机行程详情，满员/无法接时可反馈 |
| 选项 | `DRIVER_REASON` 司机原因 · `PASSENGER_REASON` 个人原因 |
| 计数 | 仅司机原因计入该司机当月额度 |
| 阈值 | 默认 **10**（`DRIVER_REASON_MONTHLY_LIMIT`） |
| 限制 | 达到后当月禁止：发布车找人、查找乘客（匹配/地图 mode=driver） |
| 刷新 | 自然月，时区 **Asia/Shanghai**，下月 1 日重新从 0 计 |
| 防刷 | 同一乘客对同一行程只能反馈一次 |

### API

- `POST /trip-feedbacks` `{ driverTripId, reason, remark? }`
- `GET /trip-feedbacks/me/driver-status`
- `GET /admin/trip-feedbacks`
- `GET /driver-trips/:id` 含 `isFull` / `canAcceptPassenger`

### 错误码

| code | 含义 |
| --- | --- |
| `40310` | 禁止发布 |
| `40311` | 禁止查找乘客 |
| `40320` | 需先绑定手机号 |
| `40901` | 重复反馈 |

---

## 3. 匹配单取消（协商取消 · U4）

### 规则

| 项 | 说明 |
| --- | --- |
| 可取消状态 | 仅 `MatchStatus.CONFIRMED` |
| 发起方 | 司机或乘客任一方（MVP 单方生效，默认线下电话协商后操作） |
| 不可 | `COMPLETED` / 已 `CANCELLED` |
| 座位 | `driverTrip.seatsLeft += match.seats`；行程若未满则 `MATCHING`，否则按余座回可匹配态 |
| 人找车 | 该需求从 `CONFIRMED` 回 `PUBLISHED` |
| 通知 | 对方 `MATCH_CANCELLED` |

### API

- `POST /matching/:id/cancel` body 可选 `{ reason?: string }`

---

## 4. 绑手机门槛（U4）

| 动作 | 要求 |
| --- | --- |
| 发布车找人 / 人找车 | 用户已绑定手机（`phoneEnc` 非空） |
| 乘客确认同行 | 乘客已绑定手机 |
| 乘客取号 | 司机已绑定手机（既有） |

客户端引导至「我的」绑定；服务端 `40320`。

---

## 5. 评价摘要（U4）

匹配候选列表附带对方用户 `ratingAvg`（1 位小数）与 `ratingCount`；无评价时 `ratingCount=0`。

---

## 6. 证件图上传（U4）

- `POST /uploads` multipart `file`（鉴权，限图片，本地磁盘 `uploads/`）
- 返回相对 URL，写入 `driver_verifications.license_img`  
- 生产可换 OSS，契约保持 URL 字符串

---

## 2. 腾讯逆地理与 adcode（匹配区）

### 目标

匹配第一层依赖 **出发地 adcode（6 位国标区县码）**。  
`wx.chooseLocation` 不返回 adcode，由 **服务端腾讯位置服务逆地理** 补全。

### 数据流

```text
小程序 chooseLocation(lat,lng,name)
    → GET /map/reverse-geocode?lat=&lng=
    → TencentMapService（Key 存在则调腾讯 API，否则 mock）
    → { adcode, province, city, district, address, source }
    → 发布 payload 带 adcode
    → 服务端 create 时 enrichPlace 再校验/补全
    → 入库 origin_adcode / dest_adcode
```

### API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/map/status` | 是否配置 Key、默认 adcode（Public） |
| GET | `/map/reverse-geocode?lat=&lng=` | 逆地理 |
| GET | `/map/geocode?address=` | 正地理 |
| GET | `/map/markers?mode=&adcode=` | 标记（按 adcode 过滤） |

### 配置

```env
# backend/.env
TENCENT_MAP_KEY=你的WebServiceKey
DEFAULT_ADCODE=130128
MATCH_SCOPE=county   # 或 city（前 4 位）
```

申请：https://lbs.qq.com/ → 应用管理 → Key → 勾选 **WebServiceAPI**。

### source 字段

| source | 含义 |
| --- | --- |
| `tencent` | 腾讯 API 成功 |
| `mock` | 未配置 Key，按邻近演示区县推断 |
| `fallback` | 参数非法或最终回落 DEFAULT_ADCODE |

### 双保险

1. **客户端选点后**立即逆地理展示 adcode  
2. **服务端发布**时 `enrichPlace`：若 adcode 空/过短，再按坐标补全  

### 缓存

服务端对 `lat/lng` 约 4 位小数缓存 10 分钟，降低配额消耗。

### 匹配范围（与 product-design 一致）

| MATCH_SCOPE | 规则 |
| --- | --- |
| `county`（默认） | `originAdcode` 完全相等 |
| `city` | 前 4 位相等 |

---

## 3. 发布取消与确认（状态机，P0）

| 规则 | 说明 |
| --- | --- |
| 取消发布 | 仅 `PUBLISHED`/`MATCHING` 且**无** status∈{CONFIRMED,COMPLETED} 的 MatchOrder |
| 部分已确认 | 行程可能仍为 MATCHING，但**禁止取消**（避免「行程取消 + match 仍可打电话」） |
| 确认防超卖 | 事务内 `seatsLeft >= need` 条件扣减；失败返回余座不足 |
| 代码 | `backend/src/common/utils/trip-lifecycle.ts` |

## 4. 联系权、举报与协议

| 规则 | 说明 |
| --- | --- |
| 非对称联系 | 仅乘客确认同行后可取司机电话 |
| 服务端强制 | `GET /users/contact-phone/:matchOrderId` |
| 举报 target | **忽略**客户端 targetUserId；按类型服务端解析；MATCH 仅双方可报、解析为对方 |
| 举报频控 | 同用户每日 ≤20；同目标未关闭重复 → 409 |
| 协议 | `legalVersion=2026-07-29`；`POST /users/me/legal-accept`；发单/确认需已接受 |
| 过期 | markers/匹配查询前惰性：时间窗结束 → EXPIRED |

---

## 5. 相关代码入口（速查）

| 域 | 后端大致路径 |
| --- | --- |
| 反馈额度 | `backend/src/trip-feedbacks/` |
| 地图/adcode | `backend/src/map/` |
| 匹配 | `backend/src/matching/` |
| 电话 | `backend/src/users/` contactPhone |
| 举报 | `backend/src/reports/` |
