import { View, Text, Button } from '@tarojs/components';

type Props = {
  title: string;
  desc?: string;
  actionText?: string;
  onAction?: () => void;
  /** 轻量符号，默认县域出行温感 */
  symbol?: string;
};

export function EmptyState({ title, desc, actionText, onAction, symbol = '🚗' }: Props) {
  return (
    <View className="eg-empty">
      <View className="eg-empty__illus" aria-hidden>
        <Text className="eg-empty__symbol">{symbol}</Text>
      </View>
      <Text className="eg-empty__title">{title}</Text>
      {desc ? <Text className="eg-empty__desc">{desc}</Text> : null}
      {actionText && onAction ? (
        <Button className="eg-btn-primary eg-empty__action" onClick={onAction}>
          {actionText}
        </Button>
      ) : null}
    </View>
  );
}
