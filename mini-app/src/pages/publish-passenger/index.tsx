import { View, Input, Button, Switch, Text, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { createPassengerRequest } from '../../services/trips';
import { choosePlace, type Place } from '../../utils/location';
import { PageShell } from '../../components/PageShell';
import { combineLocalIso, defaultTimeWindow, formatLocalLabel } from '../../utils/datetime';
import { handleActionError } from '../../utils/legal-guard';
import { ensurePhoneBound, handlePhoneRequiredError } from '../../utils/phone-guard';

export default function PublishPassenger() {
  const tw = defaultTimeWindow();
  const [origin, setOrigin] = useState<Place | null>(null);
  const [dest, setDest] = useState<Place | null>(null);
  const [seats, setSeats] = useState('1');
  const [isPublic, setIsPublic] = useState(true);
  const [startDate, setStartDate] = useState(tw.startDate);
  const [startTime, setStartTime] = useState(tw.startTime);
  const [endDate, setEndDate] = useState(tw.endDate);
  const [endTime, setEndTime] = useState(tw.endTime);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!(await ensurePhoneBound('发布人找车前请绑定手机号。'))) {
      return;
    }
    if (!origin || !dest) {
      Taro.showToast({ title: '请选择出发地与目的地', icon: 'none' });
      return;
    }
    const seatsN = Number(seats);
    if (!seatsN || seatsN < 1) {
      Taro.showToast({ title: '请填写有效人数', icon: 'none' });
      return;
    }
    const start = combineLocalIso(startDate, startTime);
    const end = combineLocalIso(endDate, endTime);
    if (!(start < end)) {
      Taro.showToast({ title: '结束时间须晚于开始', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await createPassengerRequest({
        origin,
        dest,
        expectStart: start.toISOString(),
        expectEnd: end.toISOString(),
        seatsNeeded: seatsN,
        visibility: isPublic ? 'PUBLIC' : 'HIDDEN',
      });
      Taro.showToast({ title: '已发布' });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch (e) {
      if (await handlePhoneRequiredError(e)) {
        return;
      }
      const accepted = await handleActionError(e);
      if (accepted) {
        try {
          await createPassengerRequest({
            origin,
            dest,
            expectStart: start.toISOString(),
            expectEnd: end.toISOString(),
            seatsNeeded: seatsN,
            visibility: isPublic ? 'PUBLIC' : 'HIDDEN',
          });
          Taro.showToast({ title: '已发布' });
          setTimeout(() => Taro.navigateBack(), 500);
        } catch {
          /* */
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <View className="eg-card">
        <View className="eg-section-title">路线</View>
        <Button
          className="eg-btn-secondary"
          onClick={async () => {
            try {
              setOrigin(await choosePlace('出发地'));
            } catch {
              /* */
            }
          }}
        >
          {origin ? origin.name : '选择出发地'}
        </Button>
        <Button
          className="eg-btn-secondary mt-sm"
          onClick={async () => {
            try {
              setDest(await choosePlace('目的地'));
            } catch {
              /* */
            }
          }}
        >
          {dest ? dest.name : '选择目的地'}
        </Button>
      </View>

      <View className="eg-card">
        <View className="eg-section-title">期望时间窗</View>
        <View className="eg-muted">最早</View>
        <View className="eg-picker-row">
          <Picker mode="date" value={startDate} onChange={(e) => setStartDate(e.detail.value)}>
            <View className="eg-btn-secondary eg-picker-option">{startDate}</View>
          </Picker>
          <Picker mode="time" value={startTime} onChange={(e) => setStartTime(e.detail.value)}>
            <View className="eg-btn-secondary eg-picker-option">{startTime}</View>
          </Picker>
        </View>
        <View className="eg-muted mt-sm">最晚</View>
        <View className="eg-picker-row">
          <Picker mode="date" value={endDate} onChange={(e) => setEndDate(e.detail.value)}>
            <View className="eg-btn-secondary eg-picker-option">{endDate}</View>
          </Picker>
          <Picker mode="time" value={endTime} onChange={(e) => setEndTime(e.detail.value)}>
            <View className="eg-btn-secondary eg-picker-option">{endTime}</View>
          </Picker>
        </View>
        <View className="eg-muted mt-sm">
          {formatLocalLabel(startDate, startTime)} ~ {formatLocalLabel(endDate, endTime)}
        </View>
      </View>

      <View className="eg-card">
        <View className="eg-section-title">人数与可见性</View>
        <View className="eg-muted">需要座位数</View>
        <Input
          value={seats}
          type="number"
          onInput={(e) => setSeats(e.detail.value)}
          className="eg-input"
        />
        <View className="eg-row-between mt-sm">
          <Text>公开（司机地图可见）</Text>
          <Switch checked={isPublic} onChange={(e) => setIsPublic(!!e.detail.value)} />
        </View>
      </View>

      <Button
        className="eg-btn-primary"
        loading={submitting}
        disabled={submitting}
        onClick={submit}
      >
        发布人找车
      </Button>
    </PageShell>
  );
}
