import { View, Text, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState } from 'react';
import {
  submitReport,
  type ReportReasonCode,
  type ReportTargetType,
} from '../../services/trips';

const REASONS: { code: ReportReasonCode; label: string }[] = [
  { code: 'harassment', label: '骚扰 / 频繁打扰' },
  { code: 'fraud', label: '欺诈 / 虚假信息' },
  { code: 'safety', label: '人身安全风险' },
  { code: 'abuse', label: '言语不当' },
  { code: 'other', label: '其他' },
];

function normalizeTargetType(raw?: string): ReportTargetType {
  const t = (raw || 'DRIVER_TRIP').toUpperCase();
  if (
    t === 'USER' ||
    t === 'DRIVER_TRIP' ||
    t === 'PASSENGER_REQUEST' ||
    t === 'MATCH'
  ) {
    return t;
  }
  return 'DRIVER_TRIP';
}

export default function ReportPage() {
  const params = useRouter().params;
  const targetType = normalizeTargetType(params.targetType);
  const targetId = params.targetId || '';
  const targetUserId = params.targetUserId || undefined;

  const [reasonCode, setReasonCode] = useState<ReportReasonCode | ''>('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!targetId) {
      Taro.showToast({ title: '缺少举报目标', icon: 'none' });
      return;
    }
    if (!reasonCode) {
      Taro.showToast({ title: '请选择举报原因', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({
        targetType,
        targetId,
        targetUserId,
        reasonCode,
        detail: detail.trim() || undefined,
      });
      Taro.showToast({ title: '已提交，我们会尽快处理' });
      setTimeout(() => Taro.navigateBack(), 600);
    } catch {
      // request toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 34, fontWeight: 600 }}>举报</Text>
      <View style={{ marginTop: 12, fontSize: 24, color: '#8c8c8c' }}>
        我们会尽快处理。请勿提交虚假信息；不会向对方展示您的完整隐私。
      </View>
      <View style={{ marginTop: 8, fontSize: 22, color: '#bfbfbf' }}>
        目标 {targetType} · {targetId.slice(0, 12)}…
      </View>

      <View style={{ marginTop: 24, fontWeight: 600 }}>举报原因 *</View>
      <View style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {REASONS.map((r) => (
          <Button
            key={r.code}
            className={reasonCode === r.code ? 'eg-btn-primary' : 'eg-btn-secondary'}
            onClick={() => setReasonCode(r.code)}
          >
            {r.label}
          </Button>
        ))}
      </View>

      <View style={{ marginTop: 24, fontWeight: 600 }}>补充说明（选填）</View>
      <Textarea
        style={{
          marginTop: 12,
          width: '100%',
          minHeight: 160,
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          boxSizing: 'border-box',
        }}
        maxlength={500}
        value={detail}
        onInput={(e) => setDetail(e.detail.value)}
        placeholder="请描述发生了什么"
      />

      <Button
        type="warn"
        style={{ marginTop: 32 }}
        loading={submitting}
        disabled={submitting || !reasonCode}
        onClick={onSubmit}
      >
        提交举报
      </Button>
    </View>
  );
}
