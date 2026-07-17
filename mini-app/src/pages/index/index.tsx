import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { getDriverQuotaStatus, type DriverQuotaStatus } from '../../services/trips';
import './index.scss';

export default function Index() {
  const { token, mode, setMode, user } = useUserStore();
  const [driverStatus, setDriverStatus] = useState<DriverQuotaStatus | null>(null);

  useDidShow(() => {
    if (!token) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    if (mode === 'driver') {
      getDriverQuotaStatus()
        .then(setDriverStatus)
        .catch(() => setDriverStatus(null));
    } else {
      setDriverStatus(null);
    }
  });

  const switchMode = () => {
    const next = mode === 'passenger' ? 'driver' : 'passenger';
    setMode(next);
    Taro.showToast({ title: next === 'passenger' ? '乘客模式' : '司机模式', icon: 'none' });
    if (next === 'driver') {
      getDriverQuotaStatus()
        .then(setDriverStatus)
        .catch(() => setDriverStatus(null));
    } else {
      setDriverStatus(null);
    }
  };

  const goPublish = () => {
    if (mode === 'driver' && driverStatus?.restricted) {
      Taro.showModal({
        title: '暂时无法发布',
        content: driverStatus.message,
        showCancel: false,
      });
      return;
    }
    Taro.navigateTo({
      url:
        mode === 'driver'
          ? '/pages/publish-driver/index'
          : '/pages/publish-passenger/index',
    });
  };

  return (
    <View className="page">
      {mode === 'driver' && driverStatus?.restricted && (
        <View
          style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            color: '#a8071a',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 24,
          }}
        >
          {driverStatus.message}
        </View>
      )}
      {mode === 'driver' && driverStatus && !driverStatus.restricted && (
        <View
          style={{
            background: '#e6f4ff',
            color: '#0958d9',
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 24,
          }}
        >
          本月司机原因反馈 {driverStatus.driverReasonCount}/{driverStatus.limit}，剩余{' '}
          {driverStatus.remaining} 次
        </View>
      )}

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
        <Button className="card" onClick={goPublish}>
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
        <Text>· 实时查看司机行程余座；满员可「无法同行」反馈</Text>
        <Text>· 反馈分：司机原因 / 个人原因；仅司机原因计月额度</Text>
        <Text>· 司机原因满 10 次：当月不能发车、不能查乘客，下月 1 日恢复</Text>
      </View>
    </View>
  );
}
