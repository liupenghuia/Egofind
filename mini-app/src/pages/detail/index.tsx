import { View, Button, Text } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useCallback, useState } from 'react';
import { useUserStore } from '../../stores/user';
import {
  confirmMatch,
  contactPhone,
  getDriverTrip,
  getPassengerRequest,
  myMatches,
  myPassengerRequests,
} from '../../services/trips';
import { formatDepartRange, formatPricePerPerson, formatTripStatus } from '../../utils/format';
import { PageShell } from '../../components/PageShell';
import { LoadingBlock } from '../../components/LoadingBlock';
import { handleActionError } from '../../utils/legal-guard';
import { ensurePhoneBound, handlePhoneRequiredError } from '../../utils/phone-guard';
import './index.scss';

type LoadState = 'loading' | 'ready' | 'error';

export default function Detail() {
  const { id, type } = useRouter().params;
  const mode = useUserStore((s) => s.mode);
  const [detail, setDetail] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [confirming, setConfirming] = useState(false);
  const [calling, setCalling] = useState(false);
  const [peerReview, setPeerReview] = useState<{
    rating: number;
    content?: string;
  } | null>(null);

  const resolveMatchId = useCallback(async (driverTripId: string) => {
    try {
      const list = (await myMatches()) as Array<{
        id: string;
        status: string;
        driverTripId?: string;
        driverTrip?: { id: string };
        peerReview?: { rating: number; content?: string } | null;
      }>;
      const hit = list.find((o) => {
        const tripId = o.driverTripId || o.driverTrip?.id;
        const okStatus = o.status === 'CONFIRMED' || o.status === 'COMPLETED';
        return tripId === driverTripId && okStatus;
      });
      if (hit) {
        setMatchId(hit.id);
        setPeerReview(hit.peerReview || null);
      }
    } catch {
      /* keep */
    }
  }, []);

  const load = useCallback(async () => {
    if (!id || !type) {
      setLoadState('error');
      return;
    }
    setLoadState('loading');
    try {
      const data = type === 'driver_trip' ? await getDriverTrip(id) : await getPassengerRequest(id);
      setDetail(data);
      setLoadState('ready');
      if (type === 'driver_trip' && mode === 'passenger') {
        await resolveMatchId(id);
      }
    } catch {
      setDetail(null);
      setLoadState('error');
    }
  }, [id, type, mode, resolveMatchId]);

  useDidShow(() => {
    load().catch(() => undefined);
  });

  const onConfirm = async () => {
    if (type !== 'driver_trip' || mode !== 'passenger') {
      Taro.showToast({ title: '仅乘客可确认同行', icon: 'none' });
      return;
    }
    if (detail?.isFull || detail?.canAcceptPassenger === false) {
      Taro.showToast({
        title: detail?.isFull ? '已满员，换一趟试试' : '当前无法接客',
        icon: 'none',
      });
      return;
    }
    if (!(await ensurePhoneBound('确认同行前请绑定手机号，便于安全联系。'))) {
      return;
    }
    setConfirming(true);
    try {
      const mine = (await myPassengerRequests()) as any[];
      const open = mine.find((r) => r.status === 'MATCHING' || r.status === 'PUBLISHED');
      if (!open) {
        Taro.showModal({
          title: '请先发布人找车',
          content: '确认同行前需要先发布一条人找车需求',
          confirmText: '去发布',
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({ url: '/pages/publish-passenger/index' });
            }
          },
        });
        return;
      }
      const order = (await confirmMatch(id!, open.id)) as { id: string };
      setMatchId(order.id);
      Taro.showToast({ title: '已确认同行' });
      await load();
    } catch (e: any) {
      if (await handlePhoneRequiredError(e)) {
        return;
      }
      const accepted = await handleActionError(e);
      if (accepted) {
        try {
          const mine2 = (await myPassengerRequests()) as any[];
          const open2 = mine2.find((r) => r.status === 'MATCHING' || r.status === 'PUBLISHED');
          if (open2) {
            const order = (await confirmMatch(id!, open2.id)) as { id: string };
            setMatchId(order.id);
            Taro.showToast({ title: '已确认同行' });
            await load();
            return;
          }
        } catch {
          /* */
        }
      }
      const msg = e?.message || '确认失败，请稍后重试';
      if (!accepted) {
        Taro.showToast({ title: String(msg).slice(0, 40), icon: 'none' });
      }
    } finally {
      setConfirming(false);
    }
  };

  const onCall = async () => {
    if (!matchId) {
      Taro.showToast({ title: '确认同行后可联系', icon: 'none' });
      return;
    }
    setCalling(true);
    try {
      const { phone } = await contactPhone(matchId);
      if (!phone) {
        Taro.showToast({ title: '暂时无法获取电话', icon: 'none' });
        return;
      }
      await Taro.makePhoneCall({ phoneNumber: phone });
    } catch (e: any) {
      const msg = e?.message || '暂时无法获取电话';
      Taro.showToast({ title: String(msg).slice(0, 40), icon: 'none' });
    } finally {
      setCalling(false);
    }
  };

  if (loadState === 'loading' && !detail) {
    return (
      <PageShell>
        <LoadingBlock />
      </PageShell>
    );
  }

  if (loadState === 'error' || !detail) {
    return (
      <PageShell>
        <View className="eg-card">
          <Text>加载失败</Text>
          <Button className="eg-btn-primary mt-sm" onClick={() => load()}>
            重试
          </Button>
          <Button className="eg-btn-secondary mt-sm" onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        </View>
      </PageShell>
    );
  }

  const seatsLabel =
    type === 'driver_trip'
      ? `余座 ${detail.seatsLeft ?? '-'} / 共 ${detail.seatsTotal ?? '-'}`
      : `需要 ${detail.seatsNeeded} 座`;
  const timeLabel =
    type === 'driver_trip'
      ? formatDepartRange(detail.departStart, detail.departEnd)
      : formatDepartRange(detail.expectStart, detail.expectEnd);
  const priceLabel = type === 'driver_trip' ? formatPricePerPerson(detail.priceCents) : null;
  const cannotAccept = !!detail.isFull || detail.canAcceptPassenger === false;
  const confirmed = !!matchId;
  const isPassengerDriverTrip = type === 'driver_trip' && mode === 'passenger';

  const step = !isPassengerDriverTrip ? 0 : confirmed ? 3 : cannotAccept ? 1 : 2;

  return (
    <View style={{ paddingBottom: isPassengerDriverTrip ? 160 : 24 }}>
      <PageShell>
        <View className="eg-card">
          <Text className="fs-xl fw-700">
            {detail.originName} → {detail.destName}
          </Text>
          <View className="eg-muted mt-sm">{timeLabel}</View>
          <View className="mt-xs">{seatsLabel}</View>
          {priceLabel && <View className="mt-xs text-brand">{priceLabel}</View>}
          {priceLabel && (
            <View className="eg-muted mt-xs">
              费用为成本分摊参考，具体请与对方线下协商确定，平台不参与费用往来
            </View>
          )}
          {type === 'driver_trip' && (
            <View
              className={`mt-xs ${detail.isFull ? 'detail__status--full' : 'detail__status--available'}`}
            >
              {detail.isFull
                ? '已满员，换一趟试试'
                : detail.canAcceptPassenger
                  ? '可接乘客'
                  : '当前不可接'}
            </View>
          )}
          <View className="eg-muted mt-xs">状态 {formatTripStatus(detail.status)}</View>
          <View className="mt-xs">备注 {detail.remark || '-'}</View>
          {peerReview && (
            <View className="mt-sm">
              对方评价：{peerReview.rating} 星{peerReview.content ? ` · ${peerReview.content}` : ''}
            </View>
          )}
        </View>

        {isPassengerDriverTrip && (
          <View className="eg-card">
            <View className="eg-section-title">进度</View>
            <View className="eg-muted">1 查看信息 → 2 确认同行 → 3 联系司机</View>
            <View className="mt-xs fw-600 text-brand">
              当前：第 {step || 1} 步
              {confirmed ? '（已确认，可联系）' : cannotAccept ? '（暂不可确认）' : '（可确认）'}
            </View>
          </View>
        )}

        {mode === 'driver' && (
          <View className="eg-card eg-muted">司机端仅可查看，不可主动联系</View>
        )}

        <Button
          className="eg-btn-danger-text"
          onClick={() => {
            const targetType = type === 'passenger_request' ? 'PASSENGER_REQUEST' : 'DRIVER_TRIP';
            const targetUserId = detail?.user?.id || detail?.userId || '';
            const q = [
              `targetType=${targetType}`,
              `targetId=${id}`,
              targetUserId ? `targetUserId=${targetUserId}` : '',
            ]
              .filter(Boolean)
              .join('&');
            Taro.navigateTo({ url: `/pages/report/index?${q}` });
          }}
        >
          举报
        </Button>
        <Button className="eg-btn-secondary mt-sm" onClick={() => load()}>
          刷新
        </Button>
      </PageShell>

      {isPassengerDriverTrip && (
        <View className="detail__action-bar">
          {!confirmed && (
            <>
              <Button
                className="eg-btn-primary"
                disabled={cannotAccept || confirming}
                loading={confirming}
                onClick={onConfirm}
              >
                确认同行
              </Button>
              <View className="eg-muted mt-xs" style={{ textAlign: 'center' }}>
                确认后可联系司机
              </View>
              <Button
                className="eg-btn-secondary mt-xs"
                onClick={() => Taro.navigateTo({ url: `/pages/feedback/index?tripId=${id}` })}
              >
                无法同行，去反馈
              </Button>
            </>
          )}
          {confirmed && (
            <>
              <View className="text-success fw-600 mb-xs">已确认同行 ✓</View>
              <Button
                className="eg-btn-primary"
                loading={calling}
                disabled={calling}
                onClick={onCall}
              >
                联系司机
              </Button>
              {matchId && (
                <Button
                  className="eg-btn-secondary mt-xs"
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/match-detail/index?id=${matchId}`,
                    })
                  }
                >
                  打开匹配详情
                </Button>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
