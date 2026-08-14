import { View, Text } from '@tarojs/components';

type Props = {
  value: number;
  onChange: (n: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 48 }: Props) {
  return (
    <View className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value >= n;
        return (
          <View
            key={n}
            onClick={() => onChange(n)}
            className="star-rating__item"
            style={{ width: size + 24, height: size + 24 }}
          >
            <Text
              className={`star-rating__star ${on ? 'star-rating__star--on' : 'star-rating__star--off'}`}
              style={{ fontSize: size }}
            >
              ★
            </Text>
          </View>
        );
      })}
    </View>
  );
}
