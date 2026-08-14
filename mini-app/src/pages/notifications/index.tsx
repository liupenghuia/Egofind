import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../../services/trips';
import { PageShell } from '../../components/PageShell';
import { EmptyState } from '../../components/EmptyState';
import { LoadingBlock } from '../../components/LoadingBlock';
import { ErrorState } from '../../components/ErrorState';
import './index.scss';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
}

function openNotificationTarget(n: NotificationItem) {
  const p = (n.payload || {}) as Record<string, string>;
  const type = n.type || '';

  if (type.startsWith('DRIVER_VERIFY') || p.verificationId) {
    Taro.navigateTo({ url: '/pages/driver-verify/index' });
    return;
  }
  if (p.matchOrderId) {
    Taro.navigateTo({
      url: `/pages/match-detail/index?id=${p.matchOrderId}`,
    });
    return;
  }
  if (type === 'MATCH_CONFIRMED' || type === 'MATCH_COMPLETED') {
    Taro.switchTab({ url: '/pages/list/index' });
    return;
  }
  // default: stay
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listNotifications();
      setItems(list || []);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    load().catch(() => undefined);
  });

  const onTap = async (n: NotificationItem) => {
    if (!n.readAt) {
      try {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
        );
      } catch {
        /* ignore */
      }
    }
    openNotificationTarget(n);
  };

  const onReadAll = async () => {
    try {
      await markAllNotificationsRead();
      Taro.showToast({ title: '已全部已读' });
      await load();
    } catch {
      /* toast */
    }
  };

  const unread = items.filter((i) => !i.readAt).length;

  return (
    <PageShell>
      <View className="eg-row-between mb-xs">
        <Text className="fs-xl fw-600">消息{unread ? `（${unread}）` : ''}</Text>
        {items.length > 0 && (
          <Button className="eg-btn-secondary btn-auto" onClick={onReadAll}>
            全部已读
          </Button>
        )}
      </View>

      {loading && <LoadingBlock />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !error && !items.length && (
        <EmptyState title="暂无消息" desc="确认同行、行程完成、认证结果会出现在这里" />
      )}

      {!loading &&
        !error &&
        items.map((n) => {
          const unreadItem = !n.readAt;
          return (
            <View
              key={n.id}
              className={`eg-card ${unreadItem ? 'notification-item--unread' : 'notification-item--read'}`}
              onClick={() => onTap(n)}
            >
              <Text className={unreadItem ? 'fw-700' : 'fw-500'}>{n.title}</Text>
              <View className="eg-muted mt-xs">{n.body}</View>
              <View className="eg-muted mt-xs fs-xs">
                {formatTime(n.createdAt)}
                {unreadItem ? ' · 未读' : ''}
              </View>
            </View>
          );
        })}

      <Button className="eg-btn-secondary" onClick={() => load()}>
        刷新
      </Button>
    </PageShell>
  );
}
