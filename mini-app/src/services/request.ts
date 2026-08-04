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

  let res: Taro.request.SuccessCallbackResult<unknown>;
  try {
    res = await Taro.request({
      url: `${BASE}${path}`,
      method,
      data,
      header,
      timeout: 20000,
    });
  } catch {
    Taro.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
    throw new Error('network error');
  }

  const status = res.statusCode || 0;
  const body = res.data as ApiBody<T> | string | null;

  if (status === 401) {
    useUserStore.getState().logout();
    Taro.showToast({ title: '请重新登录', icon: 'none' });
    Taro.navigateTo({ url: '/pages/login/index' });
    throw new Error('Unauthorized');
  }

  if (typeof body !== 'object' || body === null) {
    if (status >= 400) {
      Taro.showToast({ title: `请求失败(${status})`, icon: 'none' });
      throw new Error(`HTTP ${status}`);
    }
    // unexpected non-JSON success
    return body as T;
  }

  if (body.code === 40100 || body.code === 40101) {
    useUserStore.getState().logout();
    Taro.showToast({ title: '请重新登录', icon: 'none' });
    Taro.navigateTo({ url: '/pages/login/index' });
    throw new Error(body.message || 'Unauthorized');
  }

  if (status >= 400 || (typeof body.code === 'number' && body.code !== 0)) {
    const msg = body.message || `请求失败(${status || body.code})`;
    Taro.showToast({ title: String(msg).slice(0, 40), icon: 'none' });
    throw new Error(msg);
  }

  return (body.data !== undefined ? body.data : body) as T;
}
