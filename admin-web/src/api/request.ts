import axios from 'axios';
import { message } from 'antd';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const request = axios.create({
  baseURL,
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('egofind_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body && typeof body.code === 'number' && body.code !== 0) {
      message.error(body.message || '请求失败');
      return Promise.reject(body);
    }
    return body?.data !== undefined ? { ...res, data: body.data } : res;
  },
  (err) => {
    const msg = err.response?.data?.message || err.message || '网络错误';
    if (err.response?.status === 401) {
      localStorage.removeItem('egofind_admin_token');
      if (!location.pathname.includes('/login')) {
        location.href = '/login';
      }
    }
    message.error(msg);
    return Promise.reject(err);
  },
);
