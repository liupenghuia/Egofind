# 腾讯逆地理与 adcode

## 目标

匹配第一层依赖 **出发地 adcode（6 位国标区县码）**。  
`wx.chooseLocation` 不返回 adcode，因此由 **服务端腾讯位置服务逆地理** 补全。

## 数据流

```text
小程序 chooseLocation(lat,lng,name)
    → GET /map/reverse-geocode?lat=&lng=
    → TencentMapService（Key 存在则调腾讯 API，否则 mock）
    → { adcode, province, city, district, address, source }
    → 发布 payload 带 adcode
    → 服务端 create 时 enrichPlace 再校验/补全
    → 入库 origin_adcode / dest_adcode
```

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/map/status` | 是否配置 Key、默认 adcode（Public） |
| GET | `/map/reverse-geocode?lat=&lng=` | 逆地理 |
| GET | `/map/geocode?address=` | 正地理 |
| GET | `/map/markers?mode=&adcode=` | 标记（按 adcode 过滤） |

## 配置

```env
# backend/.env
TENCENT_MAP_KEY=你的WebServiceKey
DEFAULT_ADCODE=130128
MATCH_SCOPE=county   # 或 city（前 4 位）
```

申请：https://lbs.qq.com/ → 应用管理 → Key → 勾选 **WebServiceAPI**。

## source 字段

| source | 含义 |
| --- | --- |
| `tencent` | 腾讯 API 成功 |
| `mock` | 未配置 Key，按邻近演示区县推断 |
| `fallback` | 参数非法或最终回落 DEFAULT_ADCODE |

## 双保险

1. **客户端选点后**立即逆地理展示 adcode  
2. **服务端发布**时 `enrichPlace`：若 adcode 空/过短，再按坐标补全  

保证即使客户端跳过逆地理，入库仍有可用区县码。

## 缓存

服务端对 `lat/lng` 约 4 位小数缓存 10 分钟，降低配额消耗。
