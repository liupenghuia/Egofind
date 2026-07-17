import { View, Button, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { useUserStore } from '../../stores/user';
import {
  confirmMatch,
  contactPhone,
  getDriverTrip,
  getPassengerRequest,
  myPassengerRequests,
} from '../../services/trips';

export default function Detail() {
  const { id, type } = useRouter().params;
  const mode = useUserStore((s) => s.mode);
  const [detail, setDetail] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const load = () => {
    if (!id || !type) return;
    (type === 'driver_trip' ? getDriverTrip(id) : getPassengerRequest(id))
      .then(setDetail)
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, [id, type]);

  const onConfirm = async () => {
    if (type !== 'driver_trip' || mode !== 'passenger') {
      Taro.showToast({ title: '仅乘客可确认同行', icon: 'none' });
      return;
    }
    if (detail?.isFull || detail?.canAcceptPassenger === false) {
      Taro.showToast({ title: '当前无法接客，可反馈原因', icon: 'none' });
      return;
    }
    const mine = (await myPassengerRequests()) as any[];
    const open = mine.find((r) => r.status === 'MATCHING' || r.status === 'PUBLISHED');
    if (!open) {
      Taro.showToast({ title: '请先发布人找车', icon: 'none' });
      return;
    }
    const order = (await confirmMatch(id!, open.id)) as { id: string };
    setMatchId(order.id);
    Taro.showToast({ title: '已确认同行' });
    load();
  };

  const onCall = async () => {
    if (!matchId) {
      Taro.showToast({ title: '请先确认同行', icon: 'none' });
      return;
    }
    const { phone } = await contactPhone(matchId);
    Taro.makePhoneCall({ phoneNumber: phone });
  };

  if (!detail) return <View style={{ padding: 24 }}>加载中…</View>;

  const seatsLabel =
    type === 'driver_trip'
      ? `余座 ${detail.seatsLeft ?? '-'} / 共 ${detail.seatsTotal ?? '-'}`
      : `需要 ${detail.seatsNeeded} 座`;

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 34, fontWeight: 600 }}>
        {detail.originName} → {detail.destName}
      </Text>
      <View style={{ marginTop: 12 }}>区县 adcode: {detail.originAdcode}</View>
      <View style={{ marginTop: 8 }}>{seatsLabel}</View>
      {type === 'driver_trip' && (
        <View style={{ marginTop: 8, color: detail.isFull ? '#cf1322' : '#389e0d' }}>
          {detail.isFull
            ? '已满员'
            : detail.canAcceptPassenger
              ? '可接乘客'
              : '当前不可接（已结束/已取消）'}
        </View>
      )}
      <View style={{ marginTop: 8 }}>状态: {detail.status}</View>
      <View style={{ marginTop: 8 }}>备注: {detail.remark || '-'}</View>

      {type === 'driver_trip' && mode === 'passenger' && (
        <>
          <Button
            type="primary"
            style={{ marginTop: 24 }}
            disabled={detail.isFull || detail.canAcceptPassenger === false}
            onClick={onConfirm}
          >
            确认同行
          </Button>
          <Button style={{ marginTop: 12 }} onClick={onCall}>
            拨打司机电话（需已确认）
          </Button>
          <Button
            style={{ marginTop: 12 }}
            onClick={() =>
              Taro.navigateTo({ url: `/pages/feedback/index?tripId=${id}` })
            }
          >
            无法同行，去反馈
          </Button>
        </>
      )}
      {mode === 'driver' && (
        <View style={{ marginTop: 24, color: '#999' }}>司机端仅可查看，不可主动联系</View>
      )}
      <Button size="mini" style={{ marginTop: 16 }} onClick={load}>
        刷新
      </Button>
    </View>
  );
}
