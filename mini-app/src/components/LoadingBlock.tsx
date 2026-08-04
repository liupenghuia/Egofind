import { View, Text } from '@tarojs/components';

type Props = { text?: string };

export function LoadingBlock({ text = '加载中…' }: Props) {
  return (
    <View className="eg-loading">
      <Text>{text}</Text>
    </View>
  );
}
