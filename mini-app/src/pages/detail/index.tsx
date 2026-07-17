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

  useEffect(() => {
    if (!id || !type) return;
    (type === 'driver_trip' ? getDriverTrip(id) : getPassengerRequest(id))
      .then(setDetail)
      .catch(() => undefined);
  }, [id, type]);

  const onConfirm = async () => {
    if (type !== 'driver_trip' || mode !== 'passenger') {
      Taro.showToast({ title: '仅乘客可确认同行', icon: 'none' });
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

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 34, fontWeight: 600 }}>
        {detail.originName} → {detail.destName}
      </Text>
      <View style={{ marginTop: 12 }}>adcode: {detail.originAdcode}</View>
      <View>座位: {detail.seatsLeft ?? detail.seatsNeeded}</View>
      <View>备注: {detail.remark || '-'}</View>
      {type === 'driver_trip' && mode === 'passenger' && (
        <>
          <Button type="primary" style={{ marginTop: 24 }} onClick={onConfirm}>
            确认同行
          </Button>
          <Button style={{ marginTop: 12 }} onClick={onCall}>
            拨打司机电话（需已确认）
          </Button>
        </>
      )}
      {mode === 'driver' && (
        <View style={{ marginTop: 24, color: '#999' }}>司机端仅可查看，不可主动联系</View>
      )}
    </View>
  );
}
