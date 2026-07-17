import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useUserStore } from '../../stores/user';
import './index.scss';

export default function Index() {
  const { token, mode, setMode, user } = useUserStore();

  useDidShow(() => {
    if (!token) {
      Taro.redirectTo({ url: '/pages/login/index' });
    }
  });

  const switchMode = () => {
    const next = mode === 'passenger' ? 'driver' : 'passenger';
    setMode(next);
    Taro.showToast({ title: next === 'passenger' ? '乘客模式' : '司机模式', icon: 'none' });
  };

  return (
    <View className="page">
      <View className="hero">
        <Text className="title">egofind 顺风车</Text>
        <Text className="sub">你好，{user?.nickname || '微信用户'}</Text>
        <View className="mode-bar">
          <Text>当前：{mode === 'passenger' ? '乘客模式' : '司机模式'}</Text>
          <Button size="mini" type="primary" onClick={switchMode}>
            切换模式
          </Button>
        </View>
      </View>

      <View className="grid">
        <Button
          className="card"
          onClick={() =>
            Taro.navigateTo({
              url:
                mode === 'driver'
                  ? '/pages/publish-driver/index'
                  : '/pages/publish-passenger/index',
            })
          }
        >
          {mode === 'driver' ? '发布车找人' : '发布人找车'}
        </Button>
        <Button className="card" onClick={() => Taro.navigateTo({ url: '/pages/map/index' })}>
          地图发现
        </Button>
        <Button className="card" onClick={() => Taro.navigateTo({ url: '/pages/list/index' })}>
          我的行程
        </Button>
        <Button className="card" onClick={() => Taro.navigateTo({ url: '/pages/mine/index' })}>
          我的
        </Button>
      </View>

      <View className="tips">
        <Text>· 仅乘客可「确认同行」并联系司机电话</Text>
        <Text>· 人找车可随时隐藏，隐藏后司机地图不可见</Text>
        <Text>· 匹配优先同一县城 adcode</Text>
      </View>
    </View>
  );
}
