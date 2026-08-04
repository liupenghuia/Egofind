export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/map/index',
    'pages/list/index',
    'pages/mine/index',
    'pages/login/index',
    'pages/legal/index',
    'pages/publish-driver/index',
    'pages/publish-passenger/index',
    'pages/detail/index',
    'pages/match-detail/index',
    'pages/feedback/index',
    'pages/review/index',
    'pages/driver-verify/index',
    'pages/match-candidates/index',
    'pages/report/index',
    'pages/notifications/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677ff',
    navigationBarTitleText: '找同行',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    custom: true,
    color: '#8c8c8c',
    selectedColor: '#1677ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tab/home.png',
        selectedIconPath: 'assets/tab/home-active.png',
      },
      {
        pagePath: 'pages/map/index',
        text: '发现',
        iconPath: 'assets/tab/map.png',
        selectedIconPath: 'assets/tab/map-active.png',
      },
      {
        pagePath: 'pages/list/index',
        text: '行程',
        iconPath: 'assets/tab/list.png',
        selectedIconPath: 'assets/tab/list-active.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tab/mine.png',
        selectedIconPath: 'assets/tab/mine-active.png',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '用于展示附近顺风车与发布行程',
    },
  },
  requiredPrivateInfos: ['getLocation', 'chooseLocation'],
});

function defineAppConfig<T>(config: T): T {
  return config;
}
