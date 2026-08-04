import { View, Text, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { submitReview } from '../../services/trips';
import { PageShell } from '../../components/PageShell';
import { StarRating } from '../../components/StarRating';

export default function ReviewPage() {
  const { matchOrderId } = useRouter().params;
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!matchOrderId) {
      Taro.showToast({ title: '缺少匹配单', icon: 'none' });
      return;
    }
    if (rating < 1 || rating > 5) {
      Taro.showToast({ title: '请选择 1–5 星', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        matchOrderId,
        rating,
        content: content.trim() || undefined,
      });
      Taro.showToast({ title: '评价成功' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch {
      /* */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <View className="eg-card">
        <Text style={{ fontSize: 34, fontWeight: 600 }}>评价对方</Text>
        <View className="eg-muted" style={{ marginTop: 12 }}>
          点击星星选择 1–5 星
        </View>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <View style={{ color: '#faad14', fontWeight: 600 }}>{rating} 星</View>
        )}
      </View>
      <View className="eg-card">
        <View className="eg-section-title">选填评语</View>
        <Textarea
          style={{
            width: '100%',
            minHeight: 160,
            background: '#f5f6f8',
            padding: 16,
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
          maxlength={500}
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          placeholder="行程体验如何？"
        />
      </View>
      <Button
        className="eg-btn-primary"
        loading={submitting}
        disabled={submitting || rating < 1}
        onClick={onSubmit}
      >
        提交评价
      </Button>
    </PageShell>
  );
}
