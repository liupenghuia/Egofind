import { View, Button, Input, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { request } from '../../services/request';
import {
  getDriverVerifyStatus,
  notificationsUnreadCount,
} from '../../services/trips';
import { PageShell } from '../../components/PageShell';
import { ModeSegment } from '../../components/ModeSegment';
import { syncCustomTabBar } from '../../utils/tab-bar';

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.TARO_APP_SHOW_DEV_HINT === '1';

export default function Mine() {
  const { user, logout, mode } = useUserStore();
  const [phone, setPhone] = useState('13800138000');
  const [verifyHint, setVerifyHint] = useState('查看认证状态');
  const [unread, setUnread] = useState(0);

  useDidShow(() => {
    syncCustomTabBar('/pages/mine/index');
    getDriverVerifyStatus()
      .then((st) => {
        if (st.status === 'APPROVED') setVerifyHint('已通过认证');
        else if (st.status === 'PENDING') setVerifyHint('审核中');
        else if (st.status === 'REJECTED') setVerifyHint('未通过，去处理');
        else setVerifyHint('去提交认证');
      })
      .catch(() => setVerifyHint('查看认证状态'));
    notificationsUnreadCount()
      .then((r) => setUnread(r.count || 0))
      .catch(() => setUnread(0));
  });

  const bindMock = async () => {
    await request('/users/phone/bind', {
      method: 'POST',
      data: { phoneNumber: phone },
    });
    Taro.showToast({ title: '已绑定(mock)' });
  };

  const onGetPhoneNumber = async (e: any) => {
    const code = e?.detail?.code;
    if (!code) {
      if (isDev) await bindMock();
      else Taro.showToast({ title: '需要手机号授权', icon: 'none' });
      return;
    }
    try {
      await request('/users/phone/bind', {
        method: 'POST',
        data: { code },
      });
      Taro.showToast({ title: '手机号已授权' });
    } catch {
      Taro.showToast({ title: '授权失败', icon: 'none' });
    }
  };

  return (
    <PageShell>
      <ModeSegment onChange={() => syncCustomTabBar('/pages/mine/index')} />

      <View className="eg-card">
        <Text style={{ fontSize: 34, fontWeight: 600 }}>
          {user?.nickname || '微信用户'}
        </Text>
        <View className="eg-muted" style={{ marginTop: 8 }}>
          {mode === 'passenger' ? '乘客模式' : '司机模式'}
          {user?.roles?.length ? ` · ${user.roles.join(',')}` : ''}
        </View>
        {user?.phoneMask ? (
          <View className="eg-muted" style={{ marginTop: 4 }}>
            手机 {user.phoneMask}
          </View>
        ) : null}
      </View>

      <View className="eg-card">
        <View className="eg-section-title">常用</View>
        <Button
          className="eg-btn-secondary"
          onClick={() =>
            Taro.navigateTo({ url: '/pages/notifications/index' })
          }
        >
          {unread > 0 ? `消息通知（${unread}）` : '消息通知'}
        </Button>
        <Button
          className="eg-btn-secondary"
          style={{ marginTop: 12 }}
          onClick={() => Taro.navigateTo({ url: '/pages/driver-verify/index' })}
        >
          司机认证 · {verifyHint}
        </Button>
        <Button
          className="eg-btn-secondary"
          style={{ marginTop: 12 }}
          onClick={() => Taro.navigateTo({ url: '/pages/legal/index' })}
        >
          用户协议与平台说明
        </Button>
      </View>

      <View className="eg-card">
        <View className="eg-section-title">手机号</View>
        <View className="eg-muted">
          确认同行后联系司机需要授权手机号
        </View>
        <Button
          className="eg-btn-primary"
          style={{ marginTop: 16 }}
          openType="getPhoneNumber"
          onGetPhoneNumber={onGetPhoneNumber}
        >
          微信手机号快速验证
        </Button>
        {isDev ? (
          <>
            <View className="eg-muted" style={{ marginTop: 16 }}>
              开发：mock 绑定
            </View>
            <Input
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
              style={{
                background: '#f5f6f8',
                marginTop: 8,
                padding: 12,
                borderRadius: 8,
              }}
            />
            <Button
              className="eg-btn-secondary"
              style={{ marginTop: 12 }}
              onClick={bindMock}
            >
              mock 绑定手机
            </Button>
          </>
        ) : null}
      </View>

      <Button
        className="eg-btn-secondary"
        onClick={() => {
          logout();
          Taro.reLaunch({ url: '/pages/login/index' });
        }}
      >
        退出登录
      </Button>
    </PageShell>
  );
}
