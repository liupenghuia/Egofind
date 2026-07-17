import { View, Button, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { wechatLogin } from '../../services/auth';
import { useUserStore } from '../../stores/user';

export default function Login() {
  const setAuth = useUserStore((s) => s.setAuth);

  const onLogin = async () => {
    try {
      Taro.showLoading({ title: '登录中' });
      const data = await wechatLogin();
      setAuth(data.accessToken, data.user);
      Taro.hideLoading();
      Taro.reLaunch({ url: '/pages/index/index' });
    } catch (e) {
      Taro.hideLoading();
      Taro.showToast({ title: '登录失败', icon: 'none' });
    }
  };

  return (
    <View style={{ padding: 48 }}>
      <Text style={{ fontSize: 40, fontWeight: 700 }}>微信登录</Text>
      <View style={{ marginTop: 24, color: '#666' }}>
        本地可用 WECHAT_MOCK=1；AppID 请在 project.config.json 替换
      </View>
      <Button type="primary" style={{ marginTop: 48 }} onClick={onLogin}>
        微信一键登录
      </Button>
    </View>
  );
}
