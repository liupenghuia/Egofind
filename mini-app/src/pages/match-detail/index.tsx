import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useCallback, useState } from 'react';
import {
  cancelMatch,
  completeMatch,
  contactPhone,
  myMatches,
} from '../../services/trips';
import { PageShell } from '../../components/PageShell';
import { formatMatchStatus } from '../../utils/format';
import { useUserStore } from '../../stores/user';
import { confirmDanger, confirmPrimary } from '../../utils/confirm';

type MatchRow = {
  id: string;
  status: string;
  seats?: number;
  driverId?: string;
  passengerId?: string;
  driverTripId?: string;
  driverTrip?: {
    id?: string;
    originName?: string;
    destName?: string;
    departStart?: string;
    departEnd?: string;
  };
  passengerRequest?: {
    originName?: string;
    destName?: string;
  };
  reviewedByMe?: boolean;
  myReview?: { rating: number } | null;
  peerReview?: { rating: number; content?: string } | null;
};

export default function MatchDetailPage() {
  const { id } = useRouter().params;
  const mode = useUserStore((s) => s.mode);
  const [row, setRow] = useState<MatchRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = (await myMatches()) as MatchRow[];
      const hit = list.find((m) => m.id === id) || null;
      setRow(hit);
    } catch {
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useDidShow(() => {
    load().catch(() => undefined);
  });

  const route =
    row?.driverTrip?.originName != null
      ? `${row.driverTrip.originName} → ${row.driverTrip.destName || '?'}`
      : row?.passengerRequest?.originName != null
        ? `${row.passengerRequest.originName} → ${row.passengerRequest.destName || '?'}`
        : '匹配行程';

  const onComplete = async () => {
    if (!row) return;
    const ok = await confirmPrimary({
      title: '标记行程完成？',
      content: '完成后双方可互评。请确认本次同行已结束。',
      confirmText: '确认完成',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await completeMatch(row.id);
      Taro.showToast({ title: '已完成' });
      await load();
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };

  const onCall = async () => {
    if (!row || mode !== 'passenger') {
      Taro.showToast({ title: '仅乘客可联系司机', icon: 'none' });
      return;
    }
    setBusy(true);
    try {
      const { phone } = await contactPhone(row.id);
      if (!phone) {
        Taro.showToast({ title: '暂时无法获取电话', icon: 'none' });
        return;
      }
      await Taro.makePhoneCall({ phoneNumber: phone });
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };

  const onCancelMatch = async () => {
    if (!row) return;
    const ok = await confirmDanger({
      title: '取消本次同行？',
      content:
        '取消后座位将退回，对方会收到通知。建议先电话协商。此操作单方即可生效。',
      confirmText: '确认取消',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await cancelMatch(row.id);
      Taro.showToast({ title: '已取消' });
      await load();
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <View className="eg-muted">加载中…</View>
      </PageShell>
    );
  }

  if (!row) {
    return (
      <PageShell>
        <View className="eg-card">
          <Text>未找到匹配单</Text>
          <Button className="eg-btn-secondary" style={{ marginTop: 16 }} onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <View className="eg-card">
        <Text style={{ fontSize: 34, fontWeight: 700 }}>{route}</Text>
        <View className="eg-muted" style={{ marginTop: 12 }}>
          状态 {formatMatchStatus(row.status)}
          {row.seats != null ? ` · ${row.seats} 座` : ''}
        </View>
        {row.peerReview && (
          <View style={{ marginTop: 12, color: '#595959' }}>
            对方评价 {row.peerReview.rating} 星
            {row.peerReview.content ? ` · ${row.peerReview.content}` : ''}
          </View>
        )}
        {row.reviewedByMe && row.myReview && (
          <View className="eg-muted" style={{ marginTop: 8 }}>
            我已评价 {row.myReview.rating} 星
          </View>
        )}
      </View>

      <View className="eg-card">
        <View className="eg-section-title">操作</View>
        {row.status === 'CONFIRMED' && mode === 'passenger' && (
          <Button className="eg-btn-primary" loading={busy} disabled={busy} onClick={onCall}>
            联系司机
          </Button>
        )}
        {row.status === 'CONFIRMED' && (
          <Button
            className="eg-btn-primary"
            style={{ marginTop: 12 }}
            loading={busy}
            disabled={busy}
            onClick={onComplete}
          >
            行程完成
          </Button>
        )}
        {row.status === 'CONFIRMED' && (
          <Button
            className="eg-btn-danger-text"
            style={{ marginTop: 12 }}
            loading={busy}
            disabled={busy}
            onClick={onCancelMatch}
          >
            取消同行
          </Button>
        )}
        {row.status === 'CANCELLED' && (
          <View className="eg-muted" style={{ marginTop: 8 }}>
            本次同行已取消，座位已释放。
          </View>
        )}
        {row.status === 'COMPLETED' && !row.reviewedByMe && (
          <Button
            className="eg-btn-primary"
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/review/index?matchOrderId=${row.id}`,
              })
            }
          >
            去评价
          </Button>
        )}
        {row.driverTripId || row.driverTrip?.id ? (
          <Button
            className="eg-btn-secondary"
            style={{ marginTop: 12 }}
            onClick={() =>
              Taro.navigateTo({
                url: `/pages/detail/index?id=${row.driverTripId || row.driverTrip?.id}&type=driver_trip`,
              })
            }
          >
            查看车找人详情
          </Button>
        ) : null}
        <Button
          className="eg-btn-danger-text"
          style={{ marginTop: 12 }}
          onClick={() =>
            Taro.navigateTo({
              url: `/pages/report/index?targetType=MATCH&targetId=${row.id}`,
            })
          }
        >
          举报
        </Button>
      </View>
    </PageShell>
  );
}
