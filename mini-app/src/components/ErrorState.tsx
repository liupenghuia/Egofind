import { View, Text, Button } from '@tarojs/components';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = '加载失败',
  message,
  onRetry,
}: Props) {
  return (
    <View className="eg-empty">
      <Text style={{ fontSize: 30, fontWeight: 600, color: '#ff4d4f' }}>
        {title}
      </Text>
      {message ? (
        <View style={{ marginTop: 12, lineHeight: 1.5 }}>{message}</View>
      ) : null}
      {onRetry ? (
        <Button className="eg-btn-primary" style={{ marginTop: 24, width: '60%' }} onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </View>
  );
}
