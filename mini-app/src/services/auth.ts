import Taro from '@tarojs/taro';
import { request } from './request';

export async function wechatLogin() {
  const { code } = await Taro.login();
  return request<{
    accessToken: string;
    user: {
      id: string;
      nickname?: string;
      avatar?: string;
      roles: string[];
      permissions: string[];
    };
  }>('/auth/wechat', {
    method: 'POST',
    data: { code: code || 'dev-mock-code' },
    auth: false,
  });
}

export function fetchMe() {
  return request('/auth/me');
}
