import { View } from '@tarojs/components';
import { PropsWithChildren } from 'react';
import { useUserStore } from '../stores/user';
import '../styles/common.scss';

type Props = PropsWithChildren<{
  className?: string;
}>;

export function PageShell({ children, className }: Props) {
  const mode = useUserStore((s) => s.mode);
  const modeClass = mode === 'driver' ? 'eg-page--driver' : 'eg-page--passenger';
  return (
    <View className={`eg-page ${modeClass} ${className || ''}`.trim()}>
      {children}
    </View>
  );
}
