import Taro from '@tarojs/taro';
import { useUserStore } from '../stores/user';

/** 发单 / 确认前：无手机则引导去「我的」绑定 */
export async function ensurePhoneBound(
  tip = '发单与确认同行需要绑定手机号，方便联系与安全核实。',
): Promise<boolean> {
  const mask = useUserStore.getState().user?.phoneMask;
  if (mask) return true;

  const res = await Taro.showModal({
    title: '请先绑定手机号',
    content: tip,
    confirmText: '去绑定',
    cancelText: '取消',
  });
  if (res.confirm) {
    Taro.switchTab({ url: '/pages/mine/index' });
  }
  return false;
}

/** 服务端 40320 / 文案含绑定手机时引导 */
export function isPhoneRequiredError(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message || e || '');
  return msg.includes('绑定手机') || msg.includes('手机号');
}

export async function handlePhoneRequiredError(e: unknown): Promise<boolean> {
  if (!isPhoneRequiredError(e)) return false;
  await ensurePhoneBound('请先在「我的」绑定手机号后再试。');
  return true;
}
