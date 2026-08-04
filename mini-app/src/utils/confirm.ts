import Taro from '@tarojs/taro';

/** Standardized secondary-confirm for destructive / irreversible actions. */
export function confirmDanger(options: {
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> {
  const {
    title,
    content,
    confirmText = '确定',
    cancelText = '再想想',
  } = options;
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      confirmText,
      cancelText,
      confirmColor: '#ff4d4f',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false),
    });
  });
}

export function confirmPrimary(options: {
  title: string;
  content: string;
  confirmText?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Taro.showModal({
      title: options.title,
      content: options.content,
      confirmText: options.confirmText || '确定',
      cancelText: '取消',
      confirmColor: '#1677ff',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false),
    });
  });
}
