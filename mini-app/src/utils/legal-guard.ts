import Taro from '@tarojs/taro';
import { acceptLegal, CURRENT_LEGAL_VERSION } from '../services/trips';

export function isLegalError(message?: string) {
  if (!message) return false;
  return (
    message.includes('用户协议') ||
    message.includes('平台说明') ||
    message.includes('legal') ||
    message.includes('协议版本')
  );
}

/** Modal when server rejects publish/confirm due to legal acceptance. */
export async function promptLegalAccept(): Promise<boolean> {
  return new Promise((resolve) => {
    Taro.showModal({
      title: '需要同意协议',
      content: '发单或确认前请阅读并同意最新《用户协议》与《平台服务说明》。',
      confirmText: '同意并继续',
      cancelText: '去阅读',
      success: async (res) => {
        if (res.confirm) {
          try {
            await acceptLegal(CURRENT_LEGAL_VERSION);
            Taro.showToast({ title: '已记录同意', icon: 'success' });
            resolve(true);
          } catch {
            Taro.showToast({ title: '记录失败，请稍后重试', icon: 'none' });
            resolve(false);
          }
          return;
        }
        if (res.cancel) {
          Taro.navigateTo({ url: '/pages/legal/index' });
        }
        resolve(false);
      },
      fail: () => resolve(false),
    });
  });
}

export async function handleActionError(err: unknown): Promise<boolean> {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (isLegalError(msg)) {
    return promptLegalAccept();
  }
  return false;
}
