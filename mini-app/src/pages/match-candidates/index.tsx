import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import {
  matchForDriver,
  matchForPassenger,
  myDriverTrips,
  myPassengerRequests,
  type MatchCandidateRequest,
  type MatchCandidateTrip,
} from '../../services/trips';
import {
  formatDepartRange,
  formatPricePerPerson,
  formatRatingSummary,
  formatTripStatus,
} from '../../utils/format';
import { PageShell } from '../../components/PageShell';
import { ModeSegment } from '../../components/ModeSegment';
import { SegmentTabs } from '../../components/SegmentTabs';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingBlock } from '../../components/LoadingBlock';

type LoadState = 'loading' | 'need_publish' | 'ready' | 'empty' | 'error';

const OPEN = new Set(['PUBLISHED', 'MATCHING']);

export default function MatchCandidatesPage() {
  const mode = useUserStore((s) => s.mode);
  const router = useRouter();
  const qId = router.params.anchorId;
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [anchorLabel, setAnchorLabel] = useState('');
  const [passengerHits, setPassengerHits] = useState<MatchCandidateTrip[]>([]);
  const [driverHits, setDriverHits] = useState<MatchCandidateRequest[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    setLoadState('loading');
    setErrorMsg('');
    try {
      if (mode === 'passenger') {
        const mine = (await myPassengerRequests()) as any[];
        let open = qId
          ? mine.find((r) => r.id === qId)
          : mine.find((r) => OPEN.has(r.status));
        if (!open) {
          open = mine.find((r) => OPEN.has(r.status));
        }
        if (!open) {
          setPassengerHits([]);
          setAnchorLabel('');
          setLoadState('need_publish');
          return;
        }
        setAnchorLabel(`${open.originName} → ${open.destName}`);
        const list = await matchForPassenger(open.id);
        setPassengerHits(list);
        setDriverHits([]);
        setLoadState(list.length ? 'ready' : 'empty');
      } else {
        const mine = (await myDriverTrips()) as any[];
        let open = qId
          ? mine.find((r) => r.id === qId)
          : mine.find((r) => OPEN.has(r.status));
        if (!open) {
          open = mine.find((r) => OPEN.has(r.status));
        }
        if (!open) {
          setDriverHits([]);
          setAnchorLabel('');
          setLoadState('need_publish');
          return;
        }
        setAnchorLabel(`${open.originName} → ${open.destName}`);
        const list = await matchForDriver(open.id);
        setDriverHits(list);
        setPassengerHits([]);
        setLoadState(list.length ? 'ready' : 'empty');
      }
    } catch (e: any) {
      setLoadState('error');
      setErrorMsg(e?.message || '加载失败');
    }
  };

  useDidShow(() => {
    load().catch(() => undefined);
  });

  const goPublish = () => {
    Taro.navigateTo({
      url:
        mode === 'driver'
          ? '/pages/publish-driver/index'
          : '/pages/publish-passenger/index',
    });
  };

  return (
    <PageShell>
      <ModeSegment onChange={() => load()} />
      <SegmentTabs
        value="list"
        onChange={(k) => {
          if (k === 'map') Taro.switchTab({ url: '/pages/map/index' });
        }}
        items={[
          { key: 'map', label: '地图' },
          { key: 'list', label: '列表推荐' },
        ]}
      />
      <Text style={{ fontSize: 34, fontWeight: 600 }}>为你推荐</Text>
      <View className="eg-muted" style={{ marginTop: 8 }}>
        {mode === 'passenger'
          ? '按匹配度排序（时间/距离/方向综合）'
          : '只读查看公开乘客 · 不可主动联系'}
      </View>
      {anchorLabel ? (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            background: '#e6f4ff',
            borderRadius: 8,
            fontSize: 24,
            color: '#0958d9',
          }}
        >
          基于：{anchorLabel}
        </View>
      ) : null}

      {loadState === 'loading' && <LoadingBlock text="加载匹配中…" />}

      {loadState === 'need_publish' && (
        <EmptyState
          title="请先发布"
          desc={
            mode === 'passenger'
              ? '发布人找车后，才能查看推荐司机'
              : '发布车找人后，才能查看公开乘客需求'
          }
          actionText="去发布"
          onAction={goPublish}
        />
      )}

      {loadState === 'error' && (
        <ErrorState message={errorMsg || '加载失败'} onRetry={() => load()} />
      )}

      {loadState === 'empty' && (
        <EmptyState
          title="附近暂无匹配"
          desc="可稍后刷新，或调整出发时间与地点后再试"
          actionText="刷新"
          onAction={() => load()}
        />
      )}

      {mode === 'passenger' &&
        passengerHits.map((item, idx) => {
          const t = item.trip;
          const price = formatPricePerPerson(t.priceCents);
          return (
            <View
              key={t.id}
              style={{
                background: '#fff',
                marginTop: 12,
                padding: 16,
                borderRadius: 12,
              }}
            >
              <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 600 }}>
                  {t.originName} → {t.destName}
                </Text>
                <Text style={{ color: '#1677ff', fontSize: 24 }}>
                  #{idx + 1} · {item.score} 分
                </Text>
              </View>
              <View style={{ marginTop: 8, fontSize: 24, color: '#8c8c8c' }}>
                {formatDepartRange(t.departStart, t.departEnd)}
              </View>
              <View style={{ marginTop: 4, fontSize: 24, color: '#8c8c8c' }}>
                约 {item.distanceKm} km · 余座 {t.seatsLeft ?? '-'}
                {t.status ? ` · ${formatTripStatus(t.status)}` : ''}
              </View>
              <View style={{ marginTop: 4, fontSize: 24, color: '#8c8c8c' }}>
                {formatRatingSummary(item.ratingAvg, item.ratingCount)}
              </View>
              {price && (
                <View style={{ marginTop: 4, color: '#1677ff', fontSize: 24 }}>
                  {price}
                </View>
              )}
              <Button
                className="eg-btn-primary"
                style={{ marginTop: 12 }}
                onClick={() =>
                  Taro.navigateTo({
                    url: `/pages/detail/index?id=${t.id}&type=driver_trip`,
                  })
                }
              >
                查看详情
              </Button>
            </View>
          );
        })}

      {mode === 'driver' &&
        driverHits.map((item, idx) => {
          const r = item.request;
          return (
            <View
              key={r.id}
              style={{
                background: '#fff',
                marginTop: 12,
                padding: 16,
                borderRadius: 12,
              }}
            >
              <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 600 }}>
                  {r.originName} → {r.destName}
                </Text>
                <Text style={{ color: '#0b6e4f', fontSize: 24 }}>
                  #{idx + 1} · {item.score} 分
                </Text>
              </View>
              <View style={{ marginTop: 8, fontSize: 24, color: '#8c8c8c' }}>
                {formatDepartRange(r.expectStart, r.expectEnd)}
              </View>
              <View style={{ marginTop: 4, fontSize: 24, color: '#8c8c8c' }}>
                约 {item.distanceKm} km · 需要 {r.seatsNeeded ?? '-'} 座
              </View>
              <View style={{ marginTop: 4, fontSize: 24, color: '#8c8c8c' }}>
                {formatRatingSummary(item.ratingAvg, item.ratingCount)}
              </View>
              <View style={{ marginTop: 8, fontSize: 22, color: '#8c8c8c' }}>
                司机端仅可查看，不可主动联系
              </View>
              <Button
                className="eg-btn-secondary"
                style={{ marginTop: 12 }}
                onClick={() =>
                  Taro.navigateTo({
                    url: `/pages/detail/index?id=${r.id}&type=passenger_request`,
                  })
                }
              >
                查看详情
              </Button>
            </View>
          );
        })}

      {(loadState === 'ready' || loadState === 'empty') && (
        <Button className="eg-btn-secondary" style={{ marginTop: 20 }} onClick={() => load()}>
          刷新
        </Button>
      )}
    </PageShell>
  );
}
