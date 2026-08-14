import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import {
  getDriverQuotaStatus,
  myMatches,
  notificationsUnreadCount,
  type DriverQuotaStatus,
} from '../../services/trips';
import { PageShell } from '../../components/PageShell';
import { ModeSegment } from '../../components/ModeSegment';
import { formatMatchStatus } from '../../utils/format';
import { syncCustomTabBar } from '../../utils/tab-bar';

type MatchBrief = {
  id: string;
  status: string;
  driverTrip?: { originName?: string; destName?: string };
  passengerRequest?: { originName?: string; destName?: string };
};

export default function Index() {
  const { token, mode, user } = useUserStore();
  const [driverStatus, setDriverStatus] = useState<DriverQuotaStatus | null>(null);
  const [unread, setUnread] = useState(0);
  const [activeMatch, setActiveMatch] = useState<MatchBrief | null>(null);

  useDidShow(() => {
    syncCustomTabBar('/pages/index/index');
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
    notificationsUnreadCount()
      .then((r) => setUnread(r.count || 0))
      .catch(() => setUnread(0));
    myMatches()
      .then((list) => {
        const arr = (list || []) as MatchBrief[];
        const hit =
          arr.find((m) => m.status === 'CONFIRMED') ||
          arr.find((m) => m.status === 'COMPLETED') ||
          null;
        setActiveMatch(hit);
      })
      .catch(() => setActiveMatch(null));
  });

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
      url: mode === 'driver' ? '/pages/publish-driver/index' : '/pages/publish-passenger/index',
    });
  };

  const routeLabel = (m: MatchBrief) => {
    const t = m.driverTrip;
    if (t?.originName) return `${t.originName} → ${t.destName || '?'}`;
    const p = m.passengerRequest;
    if (p?.originName) return `${p.originName} → ${p.destName || '?'}`;
    return '进行中的行程';
  };

  return (
    <PageShell>
      {mode === 'driver' && driverStatus?.restricted && (
        <View className="eg-banner-danger">{driverStatus.message}</View>
      )}
      {mode === 'driver' && driverStatus && !driverStatus?.restricted && (
        <View className="eg-banner-info">
          本月司机原因反馈 {driverStatus.driverReasonCount}/{driverStatus.limit}，剩余{' '}
          {driverStatus.remaining} 次
        </View>
      )}

      <View
        className={mode === 'driver' ? 'eg-hero eg-hero--driver' : 'eg-hero eg-hero--passenger'}
      >
        <Text className="eg-hero__title">找同行</Text>
        <Text className="eg-hero__sub">你好，{user?.nickname || '微信用户'}</Text>
      </View>

      <ModeSegment
        onChange={(next) => {
          syncCustomTabBar('/pages/index/index');
          if (next === 'driver') {
            getDriverQuotaStatus()
              .then(setDriverStatus)
              .catch(() => setDriverStatus(null));
          } else {
            setDriverStatus(null);
          }
        }}
      />

      {activeMatch ? (
        <View className="eg-card">
          <View className="eg-section-title">进行中</View>
          <Text className="fw-600">{routeLabel(activeMatch)}</Text>
          <View className="eg-muted mt-xs">状态 {formatMatchStatus(activeMatch.status)}</View>
          <Button
            className="eg-btn-primary mt-sm"
            onClick={() => Taro.switchTab({ url: '/pages/list/index' })}
          >
            查看行程
          </Button>
        </View>
      ) : (
        <View className="eg-card">
          <View className="eg-section-title">开始找同行</View>
          <View className="eg-muted">
            {mode === 'passenger'
              ? '发布人找车，或去附近看看有没有顺路的车'
              : '发布车找人，让乘客发现你的空座'}
          </View>
          <Button className="eg-btn-primary mt-sm" onClick={goPublish}>
            {mode === 'driver' ? '发布车找人' : '发布人找车'}
          </Button>
          <Button
            className="eg-btn-secondary mt-sm"
            onClick={() => Taro.switchTab({ url: '/pages/map/index' })}
          >
            去地图发现
          </Button>
        </View>
      )}

      <View className="eg-entry-row">
        <View
          className="eg-entry"
          onClick={() => Taro.navigateTo({ url: '/pages/match-candidates/index' })}
        >
          <Text className="eg-entry__title">为你推荐</Text>
          <Text className="eg-entry__desc">按匹配度排序</Text>
        </View>
        <View
          className="eg-entry"
          onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })}
        >
          <Text className="eg-entry__title">{unread > 0 ? `消息 ${unread}` : '消息'}</Text>
          <Text className="eg-entry__desc">通知与提醒</Text>
        </View>
      </View>

      {mode === 'driver' && (
        <View
          className="eg-entry mb-md"
          onClick={() => Taro.navigateTo({ url: '/pages/driver-verify/index' })}
        >
          <Text className="eg-entry__title">司机认证</Text>
          <Text className="eg-entry__desc">通过后才可发布车找人</Text>
        </View>
      )}
    </PageShell>
  );
}
