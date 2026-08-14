import { View, Button, Text, Checkbox } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { wechatLogin } from '../../services/auth';
import { useUserStore } from '../../stores/user';
import { acceptLegal, CURRENT_LEGAL_VERSION } from '../../services/trips';
import { PageShell } from '../../components/PageShell';
import './index.scss';

const isDev = process.env.NODE_ENV === 'development' || process.env.TARO_APP_SHOW_DEV_HINT === '1';

export default function Login() {
  const setAuth = useUserStore((s) => s.setAuth);
  const [agreed, setAgreed] = useState(false);

  const onLogin = async () => {
    if (!agreed) {
      Taro.showToast({
        title: '请先阅读并同意协议',
        icon: 'none',
      });
      return;
    }
    try {
      Taro.showLoading({ title: '登录中' });
      const data = await wechatLogin();
      setAuth(data.accessToken, {
        id: data.user.id,
        nickname: data.user.nickname,
        avatar: data.user.avatar,
        roles: data.user.roles || [],
      });
      try {
        await acceptLegal(CURRENT_LEGAL_VERSION);
      } catch {
        /* migrate may be pending */
      }
      try {
        Taro.setStorageSync('egofind_legal_agreed', CURRENT_LEGAL_VERSION);
      } catch {
        /* ignore */
      }
      Taro.hideLoading();
      Taro.switchTab({ url: '/pages/index/index' });
    } catch (e) {
      Taro.hideLoading();
      Taro.showToast({ title: '登录失败', icon: 'none' });
    }
  };

  const openLegal = (section?: string) => {
    const q = section ? `?section=${section}` : '';
    Taro.navigateTo({ url: `/pages/legal/index${q}` });
  };

  return (
    <PageShell>
      <Text className="fs-xxl fw-700">欢迎使用找同行</Text>
      <View className="eg-muted mt-sm">
        县域信息撮合，帮你发现顺路的车与人。确认同行后才可联系，更安心。
      </View>

      <View className="eg-card mt-lg login__agree-row" onClick={() => setAgreed((v) => !v)}>
        <Checkbox value="agree" checked={agreed} color="#1677ff" />
        <View className="ml-sm fs-sm login__agree-text">
          <Text>我已阅读并同意</Text>
          <Text
            className="text-brand"
            onClick={(e) => {
              e.stopPropagation();
              openLegal('user');
            }}
          >
            《用户协议》
          </Text>
          <Text>与</Text>
          <Text
            className="text-brand"
            onClick={(e) => {
              e.stopPropagation();
              openLegal('platform');
            }}
          >
            《平台服务说明》
          </Text>
        </View>
      </View>

      <Button className="eg-btn-primary mt-xl" onClick={onLogin}>
        微信一键登录
      </Button>
      <Button className="eg-btn-secondary mt-sm" onClick={() => openLegal()}>
        查看完整协议
      </Button>

      {isDev ? <View className="eg-muted mt-lg">开发提示：本地可配置 WECHAT_MOCK=1</View> : null}
    </PageShell>
  );
}
