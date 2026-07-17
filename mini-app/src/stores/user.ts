import { create } from 'zustand';
import Taro from '@tarojs/taro';

export type Mode = 'passenger' | 'driver';

type UserInfo = {
  id: string;
  nickname?: string;
  avatar?: string;
  roles: string[];
};

type UserState = {
  token: string | null;
  user: UserInfo | null;
  mode: Mode;
  setAuth: (token: string, user: UserInfo | null) => void;
  setMode: (mode: Mode) => void;
  logout: () => void;
};

function loadToken() {
  try {
    return (Taro.getStorageSync('egofind_token') as string) || null;
  } catch {
    return null;
  }
}

function loadMode(): Mode {
  try {
    return (Taro.getStorageSync('egofind_mode') as Mode) || 'passenger';
  } catch {
    return 'passenger';
  }
}

export const useUserStore = create<UserState>((set) => ({
  token: loadToken(),
  user: null,
  mode: loadMode(),
  setAuth: (token, user) => {
    Taro.setStorageSync('egofind_token', token);
    set({ token, user });
  },
  setMode: (mode) => {
    Taro.setStorageSync('egofind_mode', mode);
    set({ mode });
  },
  logout: () => {
    Taro.removeStorageSync('egofind_token');
    set({ token: null, user: null });
  },
}));
