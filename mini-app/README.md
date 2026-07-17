# @egofind/mini-app

Taro 4 + React + Zustand 微信小程序。

```bash
pnpm --filter @egofind/mini-app install   # 若 workspace 已装可跳过
pnpm --filter @egofind/mini-app dev:weapp
```

微信开发者工具打开本目录，编译到 `dist/`。

配置：

- `project.config.json` → `appid`
- `TARO_APP_API_BASE`（见 `.env.example`）

页面：登录、首页双模式、发布车找人/人找车、地图、详情确认同行、我的行程、绑定手机 mock。
