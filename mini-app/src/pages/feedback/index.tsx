import { View, Button, Text, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { submitTripFeedback, type TripFeedbackReason } from '../../services/trips';
import { PageShell } from '../../components/PageShell';
import './index.scss';

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
    <PageShell>
      <Text className="fs-xl fw-600">无法同行反馈</Text>
      <View className="eg-muted mt-sm">
        若对方满员或无法接您，可选择原因反馈。选「司机原因」将计入该司机本月额度（满 10
        次将限制其发布与查找）。
      </View>

      <Button
        className={`mt-lg ${reason === 'DRIVER_REASON' ? 'eg-btn-primary' : 'eg-btn-secondary'}`}
        onClick={() => setReason('DRIVER_REASON')}
      >
        司机原因（满员/不接/失联等）
      </Button>
      <Button
        className={`mt-sm ${reason === 'PASSENGER_REASON' ? 'eg-btn-primary' : 'eg-btn-secondary'}`}
        onClick={() => setReason('PASSENGER_REASON')}
      >
        个人原因
      </Button>

      <View className="mt-md">备注（可选）</View>
      <Textarea
        value={remark}
        maxlength={100}
        placeholder="简要说明"
        onInput={(e) => setRemark(e.detail.value)}
        className="feedback__textarea mt-xs"
      />

      <Button className="eg-btn-primary mt-lg" loading={loading} onClick={submit}>
        提交反馈
      </Button>
    </PageShell>
  );
}
