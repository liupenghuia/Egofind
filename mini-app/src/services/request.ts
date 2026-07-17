import Taro from '@tarojs/taro';
import { useUserStore } from '../stores/user';

const BASE = process.env.TARO_APP_API_BASE || 'http://localhost:3000';

type ApiBody<T> = { code: number; message: string; data: T };

export async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    data?: unknown;
    auth?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', data, auth = true } = options;
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = useUserStore.getState().token;
    if (token) header.Authorization = `Bearer ${token}`;
  }

  const res = await Taro.request({
    url: `${BASE}${path}`,
    method,
    data,
    header,
  });

  const body = res.data as ApiBody<T>;
  if (res.statusCode === 401 || body?.code === 40100 || body?.code === 40101) {
    useUserStore.getState().logout();
    Taro.showToast({ title: '请重新登录', icon: 'none' });
    Taro.navigateTo({ url: '/pages/login/index' });
    throw new Error(body?.message || 'Unauthorized');
  }
  if (body && typeof body.code === 'number' && body.code !== 0) {
    Taro.showToast({ title: body.message || '请求失败', icon: 'none' });
    throw new Error(body.message || 'error');
  }
  return (body?.data ?? body) as T;
}
