import { View, Text, Button, Switch } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import {
  cancelDriverTrip,
  cancelPassengerRequest,
  myDriverTrips,
  myMatches,
  myPassengerRequests,
  setVisibility,
} from '../../services/trips';
import { formatMatchStatus, formatTripStatus } from '../../utils/format';
import { PageShell } from '../../components/PageShell';
import { ModeSegment } from '../../components/ModeSegment';
import { EmptyState } from '../../components/EmptyState';
import { SegmentTabs } from '../../components/SegmentTabs';
import { syncCustomTabBar } from '../../utils/tab-bar';
import { confirmDanger } from '../../utils/confirm';

type MatchRow = {
  id: string;
  status: string;
  seats?: number;
  driverTrip?: { originName?: string; destName?: string };
  passengerRequest?: { originName?: string; destName?: string };
  reviewedByMe?: boolean;
  myReview?: { rating: number } | null;
  peerReview?: { rating: number } | null;
};

export default function ListPage() {
  const mode = useUserStore((s) => s.mode);
  const [tab, setTab] = useState<'publish' | 'match'>('match');
  const [rows, setRows] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);

  const load = async () => {
    if (mode === 'driver') setRows((await myDriverTrips()) as any[]);
    else setRows((await myPassengerRequests()) as any[]);
    setMatches((await myMatches()) as MatchRow[]);
  };

  useDidShow(() => {
    syncCustomTabBar('/pages/list/index');
    load().catch(() => undefined);
  });

  const onCancelPublish = async (id: string) => {
    const ok = await confirmDanger({
      title: '取消发布？',
      content: '取消后该发布将离开匹配池与地图，附近用户将看不到。此操作不可恢复。',
      confirmText: '确认取消',
    });
    if (!ok) return;
    try {
      if (mode === 'driver') await cancelDriverTrip(id);
      else await cancelPassengerRequest(id);
      Taro.showToast({ title: '已取消发布' });
      await load();
    } catch {
      /* */
    }
  };

  const routeLabel = (m: MatchRow) => {
    const t = m.driverTrip;
    if (t?.originName || t?.destName) {
      return `${t.originName || '?'} → ${t.destName || '?'}`;
    }
    const p = m.passengerRequest;
    if (p?.originName || p?.destName) {
      return `${p.originName || '?'} → ${p.destName || '?'}`;
    }
    return `匹配单 ${m.id.slice(0, 8)}`;
  };

  const primaryMatchAction = (m: MatchRow) => {
    if (m.status === 'CONFIRMED') return '查看并完成';
    if (m.status === 'COMPLETED' && !m.reviewedByMe) return '去评价';
    return '查看详情';
  };

  return (
    <PageShell>
      <ModeSegment onChange={() => load()} />
      <SegmentTabs
        value={tab}
        onChange={(k) => setTab(k as 'publish' | 'match')}
        items={[
          { key: 'match', label: '匹配单' },
          { key: 'publish', label: '我的发布' },
        ]}
      />

      {tab === 'publish' && (
        <>
          {!rows.length && (
            <EmptyState
              title="暂无发布"
              desc="发布后可在此管理，并查看匹配"
              actionText={mode === 'driver' ? '发布车找人' : '发布人找车'}
              onAction={() =>
                Taro.navigateTo({
                  url:
                    mode === 'driver'
                      ? '/pages/publish-driver/index'
                      : '/pages/publish-passenger/index',
                })
              }
            />
          )}
          {rows.map((r) => (
            <View key={r.id} className="eg-card">
              <Text className="fw-600">
                {r.originName} → {r.destName}
              </Text>
              <View className="eg-muted mt-xs">状态 {formatTripStatus(r.status)}</View>
              {mode === 'passenger' && (r.status === 'PUBLISHED' || r.status === 'MATCHING') && (
                <View className="eg-row-between mt-sm">
                  <Text>公开</Text>
                  <Switch
                    checked={r.visibility === 'PUBLIC'}
                    onChange={async (e) => {
                      await setVisibility(r.id, e.detail.value ? 'PUBLIC' : 'HIDDEN');
                      load();
                    }}
                  />
                </View>
              )}
              {(r.status === 'PUBLISHED' || r.status === 'MATCHING') && (
                <>
                  <Button
                    className="eg-btn-primary mt-sm"
                    onClick={() =>
                      Taro.navigateTo({
                        url: `/pages/match-candidates/index?anchorId=${r.id}`,
                      })
                    }
                  >
                    看匹配
                  </Button>
                  <Button
                    className="eg-btn-danger-text mt-xs"
                    onClick={() => onCancelPublish(r.id)}
                  >
                    取消发布
                  </Button>
                </>
              )}
            </View>
          ))}
        </>
      )}

      {tab === 'match' && (
        <>
          {!matches.length && (
            <EmptyState
              title="暂无匹配单"
              desc="确认同行后会出现在这里"
              actionText="去发现"
              onAction={() => Taro.switchTab({ url: '/pages/map/index' })}
            />
          )}
          {matches.map((m) => (
            <View key={m.id} className="eg-card">
              <Text className="fw-600">{routeLabel(m)}</Text>
              <View className="eg-muted mt-xs">
                状态 {formatMatchStatus(m.status)}
                {m.seats != null ? ` · ${m.seats} 座` : ''}
              </View>
              {m.peerReview && (
                <View className="eg-muted mt-xs">对方已评 {m.peerReview.rating} 星</View>
              )}
              {m.reviewedByMe && m.myReview && (
                <View className="mt-xs text-success fs-sm">已评价 {m.myReview.rating} 星</View>
              )}
              <Button
                className="eg-btn-primary mt-sm"
                onClick={() =>
                  Taro.navigateTo({
                    url: `/pages/match-detail/index?id=${m.id}`,
                  })
                }
              >
                {primaryMatchAction(m)}
              </Button>
            </View>
          ))}
        </>
      )}

      <Button className="eg-btn-secondary mt-xs" onClick={() => load()}>
        刷新
      </Button>
    </PageShell>
  );
}
