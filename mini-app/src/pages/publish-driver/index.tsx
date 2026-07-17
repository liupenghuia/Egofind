import { View, Input, Button, Textarea, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { createDriverTrip } from '../../services/trips';
import { choosePlace, type Place } from '../../utils/location';

const DEMO_ORIGIN: Place = {
  name: '深泽县客运站（点此可重选）',
  lat: 38.184,
  lng: 115.201,
  adcode: '130128',
};
const DEMO_DEST: Place = {
  name: '深泽县政府（点此可重选）',
  lat: 38.1845,
  lng: 115.21,
  adcode: '130128',
};

export default function PublishDriver() {
  const [origin, setOrigin] = useState<Place>(DEMO_ORIGIN);
  const [dest, setDest] = useState<Place>(DEMO_DEST);
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('15');
  const [remark, setRemark] = useState('');
  const [plateNo, setPlateNo] = useState('冀A·DEMO');

  const submit = async () => {
    const start = new Date();
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await createDriverTrip({
      origin,
      dest,
      departStart: start.toISOString(),
      departEnd: end.toISOString(),
      seatsTotal: Number(seats) || 1,
      priceCents: Math.round(Number(price || 0) * 100),
      remark,
      vehicleSnap: { plateNo, carModel: '轿车', carColor: '白' },
    });
    Taro.showToast({ title: '已发布' });
    setTimeout(() => Taro.navigateBack(), 500);
  };

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontWeight: 600 }}>出发地</Text>
      <Button
        size="mini"
        onClick={async () => {
          try {
            setOrigin(await choosePlace('出发地'));
          } catch {
            /* cancelled */
          }
        }}
      >
        {origin.name}
      </Button>
      <Text style={{ fontWeight: 600, marginTop: 16, display: 'block' }}>目的地</Text>
      <Button
        size="mini"
        onClick={async () => {
          try {
            setDest(await choosePlace('目的地'));
          } catch {
            /* cancelled */
          }
        }}
      >
        {dest.name}
      </Button>
      <View style={{ marginTop: 16, fontSize: 24, color: '#888' }}>
        出发 adcode: {origin.adcode}
        {origin.source ? ` (${origin.source})` : ''} · 到达: {dest.adcode}
      </View>
      <View style={{ fontSize: 22, color: '#aaa' }}>
        选点后走服务端腾讯逆地理；无 Key 时为 mock 区县
      </View>
      <View style={{ marginTop: 16 }}>余座</View>
      <Input value={seats} onInput={(e) => setSeats(e.detail.value)} type="number" />
      <View style={{ marginTop: 16 }}>分摊价（元）</View>
      <Input value={price} onInput={(e) => setPrice(e.detail.value)} type="digit" />
      <View style={{ marginTop: 16 }}>车牌</View>
      <Input value={plateNo} onInput={(e) => setPlateNo(e.detail.value)} />
      <View style={{ marginTop: 16 }}>备注</View>
      <Textarea value={remark} onInput={(e) => setRemark(e.detail.value)} />
      <Button type="primary" style={{ marginTop: 24 }} onClick={submit}>
        发布车找人
      </Button>
    </View>
  );
}
