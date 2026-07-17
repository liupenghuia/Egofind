import { View, Button, Text, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { submitTripFeedback, type TripFeedbackReason } from '../../services/trips';

export default function FeedbackPage() {
  const { tripId } = useRouter().params;
  const [reason, setReason] = useState<TripFeedbackReason | null>(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!tripId) {
      Taro.showToast({ title: '缺少行程', icon: 'none' });
      return;
    }
    if (!reason) {
      Taro.showToast({ title: '请选择原因', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      await submitTripFeedback({
        driverTripId: tripId,
        reason,
        remark: remark || undefined,
      });
      Taro.showToast({ title: '已提交' });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch {
      /* toast by request */
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 34, fontWeight: 600 }}>无法同行反馈</Text>
      <View style={{ marginTop: 12, color: '#666', fontSize: 26 }}>
        若对方满员或无法接您，可选择原因反馈。选「司机原因」将计入该司机本月额度（满 10
        次将限制其发布与查找）。
      </View>

      <Button
        style={{
          marginTop: 32,
          background: reason === 'DRIVER_REASON' ? '#1677ff' : '#fff',
          color: reason === 'DRIVER_REASON' ? '#fff' : '#333',
        }}
        onClick={() => setReason('DRIVER_REASON')}
      >
        司机原因（满员/不接/失联等）
      </Button>
      <Button
        style={{
          marginTop: 16,
          background: reason === 'PASSENGER_REASON' ? '#1677ff' : '#fff',
          color: reason === 'PASSENGER_REASON' ? '#fff' : '#333',
        }}
        onClick={() => setReason('PASSENGER_REASON')}
      >
        个人原因
      </Button>

      <View style={{ marginTop: 24 }}>备注（可选）</View>
      <Textarea
        value={remark}
        maxlength={100}
        placeholder="简要说明"
        onInput={(e) => setRemark(e.detail.value)}
        style={{ background: '#fff', marginTop: 8, padding: 12, width: '100%' }}
      />

      <Button type="primary" loading={loading} style={{ marginTop: 32 }} onClick={submit}>
        提交反馈
      </Button>
    </View>
  );
}
