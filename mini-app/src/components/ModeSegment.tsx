import { View, Text } from '@tarojs/components';
import { useUserStore, type Mode } from '../stores/user';
import { setServerMode } from '../services/trips';
import Taro from '@tarojs/taro';

type Props = {
  onChange?: (mode: Mode) => void;
};

export function ModeSegment({ onChange }: Props) {
  const mode = useUserStore((s) => s.mode);
  const setMode = useUserStore((s) => s.setMode);

  const switchTo = async (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    onChange?.(next);
    Taro.showToast({
      title: next === 'passenger' ? '乘客模式' : '司机模式',
      icon: 'none',
      duration: 1200,
    });
    try {
      await setServerMode(next);
    } catch {
      /* local mode still ok */
    }
  };

  return (
    <View className="eg-mode-segment">
      <View
        className={
          mode === 'passenger'
            ? 'eg-mode-segment__item eg-mode-segment__item--active-passenger'
            : 'eg-mode-segment__item'
        }
        onClick={() => switchTo('passenger')}
      >
        <Text>乘客</Text>
      </View>
      <View
        className={
          mode === 'driver'
            ? 'eg-mode-segment__item eg-mode-segment__item--active-driver'
            : 'eg-mode-segment__item'
        }
        onClick={() => switchTo('driver')}
      >
        <Text>司机</Text>
      </View>
    </View>
  );
}
