# 无法同行反馈与司机原因月额度

## 规则

| 项 | 说明 |
| --- | --- |
| 场景 | 乘客查看司机行程详情，满员/无法接时可反馈 |
| 选项 | `DRIVER_REASON` 司机原因 · `PASSENGER_REASON` 个人原因 |
| 计数 | 仅司机原因计入该司机当月额度 |
| 阈值 | 默认 **10**（`DRIVER_REASON_MONTHLY_LIMIT`） |
| 限制 | 达到后当月禁止：发布车找人、查找乘客（匹配/地图 mode=driver） |
| 刷新 | 自然月，时区 **Asia/Shanghai**，下月 1 日重新从 0 计 |
| 防刷 | 同一乘客对同一行程只能反馈一次 |

## API

- `POST /trip-feedbacks` `{ driverTripId, reason, remark? }`
- `GET /trip-feedbacks/me/driver-status`
- `GET /admin/trip-feedbacks`
- `GET /driver-trips/:id` 含 `isFull` / `canAcceptPassenger`

## 错误码

- `40310` 禁止发布  
- `40311` 禁止查找乘客  
- `40901` 重复反馈  
