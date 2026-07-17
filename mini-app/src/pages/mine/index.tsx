import { View, Button, Input, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { request } from '../../services/request';

export default function Mine() {
  const { user, logout, mode } = useUserStore();
  const [phone, setPhone] = useState('13800138000');

  const bindMock = async () => {
    await request('/users/phone/bind', {
      method: 'POST',
      data: { phoneNumber: phone },
    });
    Taro.showToast({ title: '已绑定(mock)' });
  };

  /** 真机：open-type getPhoneNumber → 后端 code 换号 */
  const onGetPhoneNumber = async (e: any) => {
    const code = e?.detail?.code;
    if (!code) {
      // 开发者工具可能没有 code，走 mock
      await bindMock();
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
    <View style={{ padding: 24 }}>
      <Text>昵称：{user?.nickname}</Text>
      <View>角色：{(user?.roles || []).join(',') || 'user'}</View>
      <View>模式：{mode}</View>
      <View style={{ marginTop: 24, fontWeight: 600 }}>手机号授权</View>
      <Text style={{ fontSize: 24, color: '#666' }}>
        真机点下方微信授权；模拟器用 mock 输入
      </Text>
      <Button
        type="primary"
        openType="getPhoneNumber"
        style={{ marginTop: 12 }}
        onGetPhoneNumber={onGetPhoneNumber}
      >
        微信手机号快速验证
      </Button>
      <View style={{ marginTop: 24 }}>开发 mock 绑定</View>
      <Input value={phone} onInput={(e) => setPhone(e.detail.value)} />
      <Button style={{ marginTop: 12 }} onClick={bindMock}>
        mock 绑定手机
      </Button>
      <Button
        style={{ marginTop: 24 }}
        onClick={() => {
          logout();
          Taro.reLaunch({ url: '/pages/login/index' });
        }}
      >
        退出登录
      </Button>
    </View>
  );
}
