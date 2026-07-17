import { View, Map, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { mapMarkers } from '../../services/trips';

export default function MapPage() {
  const mode = useUserStore((s) => s.mode);
  const [markers, setMarkers] = useState<
    { id: number; latitude: number; longitude: number; title: string; width: number; height: number; rawId: string; type: string }[]
  >([]);

  const load = async () => {
    const list = await mapMarkers(mode, '130128');
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

  useDidShow(() => {
    load().catch(() => undefined);
  });

  return (
    <View>
      <View style={{ padding: 16, background: '#fff' }}>
        <Text>
          {mode === 'passenger' ? '显示附近车找人' : '显示附近人找车（仅公开）'} · adcode=130128
        </Text>
      </View>
      <Map
        style={{ width: '100%', height: '70vh' }}
        latitude={38.184}
        longitude={115.201}
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
