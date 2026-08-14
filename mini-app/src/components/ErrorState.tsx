import { View, Text, Button } from '@tarojs/components';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ title = '加载失败', message, onRetry }: Props) {
  return (
    <View className="eg-empty">
      <Text className="eg-empty__title eg-empty__title--danger">{title}</Text>
      {message ? <View className="eg-empty__desc">{message}</View> : null}
      {onRetry ? (
        <Button className="eg-btn-primary eg-empty__action" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </View>
  );
}
