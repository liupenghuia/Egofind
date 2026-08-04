import Taro from '@tarojs/taro';
import { useUserStore } from '../stores/user';

const PATH_INDEX: Record<string, number> = {
  '/pages/index/index': 0,
  'pages/index/index': 0,
  '/pages/map/index': 1,
  'pages/map/index': 1,
  '/pages/list/index': 2,
  'pages/list/index': 2,
  '/pages/mine/index': 3,
  'pages/mine/index': 3,
};

/** Sync custom tab bar selected index + mode color. */
export function syncCustomTabBar(pagePath: string) {
  try {
    const pages = Taro.getCurrentPages();
    const page = pages[pages.length - 1] as any;
    const tab = page?.getTabBar?.();
    if (!tab) return;
    const idx = PATH_INDEX[pagePath] ?? 0;
    const mode = useUserStore.getState().mode;
    if (typeof tab.setSelected === 'function') tab.setSelected(idx);
    if (typeof tab.setMode === 'function') tab.setMode(mode);
    // class component setState fallback
    if (typeof tab.setState === 'function') {
      tab.setState({ selected: idx, mode });
    }
  } catch {
    /* ignore */
  }
}
