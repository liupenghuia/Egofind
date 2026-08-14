import { View, Text } from '@tarojs/components';
import { useUserStore } from '../stores/user';

type Item = { key: string; label: string };

type Props = {
  items: Item[];
  value: string;
  onChange: (key: string) => void;
};

export function SegmentTabs({ items, value, onChange }: Props) {
  const mode = useUserStore((s) => s.mode);
  return (
    <View className="eg-mode-segment mb-sm">
      {items.map((it) => {
        const active = it.key === value;
        const activeClass =
          mode === 'driver'
            ? 'eg-mode-segment__item--active-driver'
            : 'eg-mode-segment__item--active-passenger';
        return (
          <View
            key={it.key}
            className={active ? `eg-mode-segment__item ${activeClass}` : 'eg-mode-segment__item'}
            onClick={() => onChange(it.key)}
          >
            <Text>{it.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
