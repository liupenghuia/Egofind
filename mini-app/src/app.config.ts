export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/publish-driver/index',
    'pages/publish-passenger/index',
    'pages/map/index',
    'pages/list/index',
    'pages/detail/index',
    'pages/feedback/index',
    'pages/mine/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677ff',
    navigationBarTitleText: 'egofind 顺风车',
    navigationBarTextStyle: 'white',
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
