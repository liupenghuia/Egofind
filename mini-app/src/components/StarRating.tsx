import { View, Text } from '@tarojs/components';

type Props = {
  value: number;
  onChange: (n: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 48 }: Props) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '16px 0',
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value >= n;
        return (
          <View
            key={n}
            onClick={() => onChange(n)}
            style={{
              width: size + 24,
              height: size + 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: size,
                color: on ? '#faad14' : '#d9d9d9',
                lineHeight: 1,
              }}
            >
              ★
            </Text>
          </View>
        );
      })}
    </View>
  );
}
