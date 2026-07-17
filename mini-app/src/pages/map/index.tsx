import { View, Map, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { mapMarkers } from '../../services/trips';
import { locateCurrentPlace } from '../../utils/location';

export default function MapPage() {
  const mode = useUserStore((s) => s.mode);
  const [adcode, setAdcode] = useState('130128');
  const [center, setCenter] = useState({ lat: 38.184, lng: 115.201 });
  const [regionLabel, setRegionLabel] = useState('默认演示区县');
  const [markers, setMarkers] = useState<
    {
      id: number;
      latitude: number;
      longitude: number;
      title: string;
      width: number;
      height: number;
      rawId: string;
      type: string;
    }[]
  >([]);

  const load = async (code: string) => {
    const list = await mapMarkers(mode, code);
    setMarkers(
      list.map((m, i) => ({
        id: i + 1,
        latitude: m.lat,
        longitude: m.lng,
        title: m.title,
        width: 24,
        height: 24,
        rawId: m.id,
        type: m.type,
      })),
    );
  };

  const refreshRegion = async () => {
    Taro.showLoading({ title: '定位…' });
    const place = await locateCurrentPlace();
    Taro.hideLoading();
    if (place) {
      setAdcode(place.adcode);
      setCenter({ lat: place.lat, lng: place.lng });
      setRegionLabel(
        [place.district || place.city, place.adcode, place.source]
          .filter(Boolean)
          .join(' · '),
      );
      await load(place.adcode);
    } else {
      Taro.showToast({ title: '定位失败，使用当前 adcode', icon: 'none' });
      await load(adcode);
    }
  };

  useDidShow(() => {
    load(adcode).catch(() => undefined);
  });

  return (
    <View>
      <View style={{ padding: 16, background: '#fff' }}>
        <Text>
          {mode === 'passenger' ? '附近车找人' : '附近人找车（仅公开）'}
        </Text>
        <View style={{ fontSize: 24, color: '#666', marginTop: 8 }}>
          匹配区县 adcode={adcode}
        </View>
        <View style={{ fontSize: 22, color: '#999' }}>{regionLabel}</View>
        <Button size="mini" type="primary" style={{ marginTop: 8 }} onClick={refreshRegion}>
          定位并解析区县
        </Button>
      </View>
      <Map
        style={{ width: '100%', height: '65vh' }}
        latitude={center.lat}
        longitude={center.lng}
        scale={13}
        markers={markers}
        showLocation
        onMarkerTap={(e) => {
          const m = markers.find((x) => x.id === Number(e.detail.markerId));
          if (!m) return;
          Taro.navigateTo({
            url: `/pages/detail/index?id=${m.rawId}&type=${m.type}`,
          });
        }}
      />
    </View>
  );
}
