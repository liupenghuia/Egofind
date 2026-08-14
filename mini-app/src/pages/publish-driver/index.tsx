import { View, Input, Button, Textarea, Text, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import {
  createDriverTrip,
  getDriverQuotaStatus,
  getDriverVerifyStatus,
} from '../../services/trips';
import { choosePlace, type Place } from '../../utils/location';
import { PageShell } from '../../components/PageShell';
import { combineLocalIso, defaultTimeWindow, formatLocalLabel } from '../../utils/datetime';
import { handleActionError } from '../../utils/legal-guard';
import { ensurePhoneBound, handlePhoneRequiredError } from '../../utils/phone-guard';
import './index.scss';

export default function PublishDriver() {
  const tw = defaultTimeWindow();
  const [origin, setOrigin] = useState<Place | null>(null);
  const [dest, setDest] = useState<Place | null>(null);
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('15');
  const [remark, setRemark] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [carModel, setCarModel] = useState('轿车');
  const [carColor, setCarColor] = useState('白');
  const [startDate, setStartDate] = useState(tw.startDate);
  const [startTime, setStartTime] = useState(tw.startTime);
  const [endDate, setEndDate] = useState(tw.endDate);
  const [endTime, setEndTime] = useState(tw.endTime);
  const [restrictedMsg, setRestrictedMsg] = useState<string | null>(null);
  const [needVerify, setNeedVerify] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useDidShow(() => {
    getDriverQuotaStatus()
      .then((s) => {
        if (s.restricted) setRestrictedMsg(s.message);
        else setRestrictedMsg(null);
      })
      .catch(() => undefined);
    getDriverVerifyStatus()
      .then((st) => {
        setNeedVerify(!st.canPublish);
        if (st.profile?.plateNo) setPlateNo(st.profile.plateNo);
        if (st.profile?.carModel) setCarModel(st.profile.carModel || '轿车');
        if (st.profile?.carColor) setCarColor(st.profile.carColor || '白');
      })
      .catch(() => setNeedVerify(true));
  });

  const promptVerify = () => {
    Taro.showModal({
      title: '请先完成司机认证',
      content: '通过认证后才可发布车找人',
      confirmText: '去认证',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({ url: '/pages/driver-verify/index' });
        }
      },
    });
  };

  const submit = async () => {
    if (restrictedMsg) {
      Taro.showModal({ title: '无法发布', content: restrictedMsg, showCancel: false });
      return;
    }
    if (needVerify) {
      promptVerify();
      return;
    }
    if (!(await ensurePhoneBound('发布车找人前请绑定手机号。'))) {
      return;
    }
    if (!origin || !dest) {
      Taro.showToast({ title: '请选择出发地与目的地', icon: 'none' });
      return;
    }
    const seatsN = Number(seats);
    if (!seatsN || seatsN < 1) {
      Taro.showToast({ title: '请填写有效余座', icon: 'none' });
      return;
    }
    const start = combineLocalIso(startDate, startTime);
    const end = combineLocalIso(endDate, endTime);
    if (!(start < end)) {
      Taro.showToast({ title: '结束时间须晚于出发', icon: 'none' });
      return;
    }
    if (start.getTime() < Date.now() - 60 * 1000) {
      Taro.showToast({ title: '出发时间不能早于现在', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await createDriverTrip({
        origin,
        dest,
        departStart: start.toISOString(),
        departEnd: end.toISOString(),
        seatsTotal: seatsN,
        priceCents: Math.round(Number(price || 0) * 100),
        remark,
        vehicleSnap: { plateNo: plateNo || undefined, carModel, carColor },
      });
      Taro.showToast({ title: '已发布' });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch (e) {
      if (await handlePhoneRequiredError(e)) {
        return;
      }
      const accepted = await handleActionError(e);
      if (accepted) {
        // retry once after legal accept
        try {
          await createDriverTrip({
            origin,
            dest,
            departStart: start.toISOString(),
            departEnd: end.toISOString(),
            seatsTotal: seatsN,
            priceCents: Math.round(Number(price || 0) * 100),
            remark,
            vehicleSnap: { plateNo: plateNo || undefined, carModel, carColor },
          });
          Taro.showToast({ title: '已发布' });
          setTimeout(() => Taro.navigateBack(), 500);
        } catch {
          /* toast */
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      {needVerify && (
        <View className="eg-banner-warn">
          尚未通过司机认证，无法发布。
          <Button className="eg-btn-primary publish-driver__verify-btn" onClick={promptVerify}>
            去认证
          </Button>
        </View>
      )}
      {restrictedMsg && <View className="eg-banner-danger">{restrictedMsg}</View>}

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
        {(origin?.adcode || dest?.adcode) && (
          <View className="eg-muted mt-sm">
            区县 {origin?.adcode || '-'} → {dest?.adcode || '-'}
          </View>
        )}
      </View>

      <View className="eg-card">
        <View className="eg-section-title">出发时间窗</View>
        <View className="eg-muted">最早出发</View>
        <View className="eg-picker-row">
          <Picker mode="date" value={startDate} onChange={(e) => setStartDate(e.detail.value)}>
            <View className="eg-btn-secondary eg-picker-option">{startDate}</View>
          </Picker>
          <Picker mode="time" value={startTime} onChange={(e) => setStartTime(e.detail.value)}>
            <View className="eg-btn-secondary eg-picker-option">{startTime}</View>
          </Picker>
        </View>
        <View className="eg-muted mt-sm">最晚出发</View>
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
        <View className="eg-section-title">座位与分摊</View>
        <View className="eg-muted">余座</View>
        <Input
          value={seats}
          type="number"
          onInput={(e) => setSeats(e.detail.value)}
          className="eg-input"
        />
        <View className="eg-muted mt-sm">分摊价（元/人，可选）</View>
        <Input
          value={price}
          type="digit"
          onInput={(e) => setPrice(e.detail.value)}
          className="eg-input"
        />
        <View className="eg-muted mt-xs fs-xs">
          费用为成本分摊参考，具体请与对方线下协商确定，平台不参与费用往来
        </View>
        <View className="eg-muted mt-sm">车牌（认证资料优先）</View>
        <Input
          value={plateNo}
          onInput={(e) => setPlateNo(e.detail.value)}
          placeholder="如 冀A12345"
          className="eg-input"
        />
        <View className="eg-muted mt-sm">备注</View>
        <Textarea
          value={remark}
          onInput={(e) => setRemark(e.detail.value)}
          className="eg-input"
          style={{ minHeight: 100 }}
        />
      </View>

      <Button
        className="eg-btn-primary"
        loading={submitting}
        disabled={submitting || needVerify}
        onClick={submit}
      >
        发布车找人
      </Button>
    </PageShell>
  );
}
