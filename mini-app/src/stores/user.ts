import { create } from 'zustand';
import Taro from '@tarojs/taro';

export type Mode = 'passenger' | 'driver';

export type UserInfo = {
  id: string;
  nickname?: string;
  avatar?: string;
  roles: string[];
  phoneMask?: string | null;
  legalVersion?: string | null;
};

type UserState = {
  token: string | null;
  user: UserInfo | null;
  mode: Mode;
  setAuth: (token: string, user: UserInfo | null) => void;
  setUser: (user: UserInfo | null) => void;
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
    const m = Taro.getStorageSync('egofind_mode') as Mode;
    return m === 'driver' ? 'driver' : 'passenger';
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
  setUser: (user) => set({ user }),
  setMode: (mode) => {
    Taro.setStorageSync('egofind_mode', mode);
    set({ mode });
  },
  logout: () => {
    Taro.removeStorageSync('egofind_token');
    set({ token: null, user: null });
  },
}));
