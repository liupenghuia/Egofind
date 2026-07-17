# 微信小程序配置要点

## 必填

| 项 | 位置 |
| --- | --- |
| AppID | `mini-app/project.config.json` → `appid` |
| AppSecret | `backend/.env` → `WECHAT_APPID` / `WECHAT_SECRET` |
| 服务器域名 | 微信公众平台 → 开发管理 → 服务器域名（request 合法域名） |

## 本地开发

```env
WECHAT_MOCK=1
```

- 登录：`POST /auth/wechat { code }` → openid = `mock_${code}`，并缓存 mock session_key  
- 手机号：`POST /users/phone/bind { phoneNumber }` 或真机 button `getPhoneNumber` 的 `code`

## 生产手机号

1. 用户 `wx.login` → 后端 `code2session` → **Redis/内存保存 session_key**  
2. 优先：`button open-type="getPhoneNumber"` 拿到 **phone code** →  
   `POST /users/phone/bind { code }` → 微信  
   `wxa/business/getuserphonenumber`  
3. 兼容旧版：`encryptedData` + `iv` + session_key AES 解密  

确认同行后，乘客：`GET /users/contact-phone/:matchOrderId`（审计日志）。

## 地图与 adcode

- 小程序：`Taro.chooseLocation` → `GET /map/reverse-geocode` 补 adcode  
- 详见 [map-adcode.md](./map-adcode.md)  
- 服务端匹配：`MATCH_SCOPE=county|city`，`MATCH_DMAX_KM`
