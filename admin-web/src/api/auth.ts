import { request } from './request';

export async function adminLogin(username: string, password: string) {
  const res = await request.post('/auth/admin/login', { username, password });
  return res.data as {
    accessToken: string;
    user: { id: string; nickname?: string; roles: string[] };
  };
}

export async function fetchMe() {
  const res = await request.get('/auth/me');
  return res.data;
}
