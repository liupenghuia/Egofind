import { View, Input, Button, Switch, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { createPassengerRequest } from '../../services/trips';
import { choosePlace, type Place } from '../../utils/location';

const DEMO_ORIGIN: Place = {
  name: '深泽县医院（可重选）',
  lat: 38.185,
  lng: 115.205,
  adcode: '130128',
};
const DEMO_DEST: Place = {
  name: '深泽县中学（可重选）',
  lat: 38.19,
  lng: 115.215,
  adcode: '130128',
};

export default function PublishPassenger() {
  const [origin, setOrigin] = useState<Place>(DEMO_ORIGIN);
  const [dest, setDest] = useState<Place>(DEMO_DEST);
  const [seats, setSeats] = useState('1');
  const [isPublic, setIsPublic] = useState(true);

  const submit = async () => {
    const start = new Date();
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await createPassengerRequest({
      origin,
      dest,
      expectStart: start.toISOString(),
      expectEnd: end.toISOString(),
      seatsNeeded: Number(seats) || 1,
      visibility: isPublic ? 'PUBLIC' : 'HIDDEN',
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
            /* */
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
            /* */
          }
        }}
      >
        {dest.name}
      </Button>
      <View style={{ marginTop: 16 }}>人数</View>
      <Input value={seats} onInput={(e) => setSeats(e.detail.value)} type="number" />
      <View style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Text>公开（司机地图可见）</Text>
        <Switch checked={isPublic} onChange={(e) => setIsPublic(!!e.detail.value)} />
      </View>
      <Button type="primary" style={{ marginTop: 24 }} onClick={submit}>
        发布人找车
      </Button>
    </View>
  );
}
