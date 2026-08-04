import { View, Map, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import { getDriverQuotaStatus, mapMarkers } from '../../services/trips';
import { locateCurrentPlace } from '../../utils/location';
import {
  formatDepartTime,
  formatPricePerPerson,
} from '../../utils/format';
import { ModeSegment } from '../../components/ModeSegment';
import { SegmentTabs } from '../../components/SegmentTabs';
import { syncCustomTabBar } from '../../utils/tab-bar';
import markerDriver from '../../assets/map/marker-driver.png';
import markerPassenger from '../../assets/map/marker-passenger.png';
import './index.scss';

type MapMarkerRow = {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  width: number;
  height: number;
  iconPath: string;
  rawId: string;
  type: string;
  seats: number;
  departStart: string;
  priceCents?: number;
};

type LoadState = 'idle' | 'loading' | 'empty' | 'error' | 'ready';

export default function MapPage() {
  const mode = useUserStore((s) => s.mode);
  const [adcode, setAdcode] = useState('130128');
  const [center, setCenter] = useState({ lat: 38.184, lng: 115.201 });
  const [regionLabel, setRegionLabel] = useState('默认演示区县');
  const [restrictTip, setRestrictTip] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MapMarkerRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [selected, setSelected] = useState<MapMarkerRow | null>(null);

  const load = async (code: string) => {
    setLoadState('loading');
    setSelected(null);
    try {
      if (mode === 'driver') {
        const st = await getDriverQuotaStatus();
        if (st.restricted) {
          setRestrictTip(st.message);
          setMarkers([]);
          setLoadState('empty');
          return;
        }
        setRestrictTip(null);
      } else {
        setRestrictTip(null);
      }
      const list = await mapMarkers(mode, code);
      // 乘客看车找人→蓝标；司机看人找车→橙标（design-system color-map-*）
      const iconPath =
        mode === 'passenger' ? markerDriver : markerPassenger;
      const rows: MapMarkerRow[] = list.map((m, i) => ({
        id: i + 1,
        latitude: m.lat,
        longitude: m.lng,
        title: m.title,
        width: 32,
        height: 32,
        iconPath,
        rawId: m.id,
        type: m.type,
        seats: m.seats,
        departStart: m.departStart,
        priceCents: m.priceCents,
      }));
      setMarkers(rows);
      setLoadState(rows.length === 0 ? 'empty' : 'ready');
    } catch {
      setMarkers([]);
      setLoadState('error');
    }
  };

  const refreshRegion = async () => {
    Taro.showLoading({ title: '定位…' });
    const place = await locateCurrentPlace();
    Taro.hideLoading();
    if (place) {
      setAdcode(place.adcode);
      setCenter({ lat: place.lat, lng: place.lng });
      const friendly =
        [place.district, place.city].filter(Boolean).join(' · ') ||
        '当前定位区县';
      setRegionLabel(friendly);
      await load(place.adcode);
    } else {
      Taro.showToast({ title: '定位失败，使用当前区县', icon: 'none' });
      await load(adcode);
    }
  };

  useDidShow(() => {
    syncCustomTabBar('/pages/map/index');
    load(adcode).catch(() => undefined);
  });

  const openDetail = (m: MapMarkerRow) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${m.rawId}&type=${m.type}`,
    });
  };

  const priceLabel =
    selected && mode === 'passenger'
      ? formatPricePerPerson(selected.priceCents)
      : null;

  const statusHint =
    loadState === 'loading'
      ? '加载附近行程…'
      : loadState === 'error'
        ? '加载失败，请重试'
        : loadState === 'empty' && !restrictTip
          ? mode === 'passenger'
            ? '附近暂无车找人，可稍后刷新'
            : '附近暂无公开人找车'
          : null;

  return (
    <View className="map-page">
      <View className="map-header">
        <ModeSegment onChange={() => load(adcode)} />
        <SegmentTabs
          value="map"
          onChange={(k) => {
            if (k === 'list') {
              Taro.navigateTo({ url: '/pages/match-candidates/index' });
            }
          }}
          items={[
            { key: 'map', label: '地图' },
            { key: 'list', label: '列表推荐' },
          ]}
        />
        {restrictTip && (
          <View className="map-header__restrict">{restrictTip}</View>
        )}
        <Text className="map-header__title">
          {mode === 'passenger' ? '附近车找人' : '附近人找车（仅公开）'}
        </Text>
        <Text className="map-header__region">{regionLabel}</Text>
        <Text className="map-header__adcode">区县 {adcode}</Text>
        {statusHint && (
          <Text
            className={
              loadState === 'error'
                ? 'map-header__status map-header__status--error'
                : 'map-header__status'
            }
          >
            {statusHint}
          </Text>
        )}
        <Button className="eg-btn-primary" style={{ marginTop: 8 }} onClick={refreshRegion}>
          定位并刷新
        </Button>
        {loadState === 'error' && (
          <Button
            className="eg-btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => load(adcode)}
          >
            重试
          </Button>
        )}
      </View>
      <Map
        className="map-canvas"
        style={{ width: '100%', height: '65vh' }}
        latitude={center.lat}
        longitude={center.lng}
        scale={13}
        markers={markers as any}
        showLocation
        onTap={() => setSelected(null)}
        onMarkerTap={(e) => {
          const m = markers.find((x) => x.id === Number(e.detail.markerId));
          if (!m) return;
          setSelected((prev) =>
            prev && prev.id === m.id ? null : m,
          );
        }}
      />
      {selected && (
        <View className="trip-sheet">
          <Text className="trip-sheet__route">{selected.title}</Text>
          <View className="trip-sheet__meta">
            <View>出发 {formatDepartTime(selected.departStart)}</View>
            <View>
              {mode === 'passenger'
                ? `余座 ${selected.seats ?? '-'}`
                : `需要 ${selected.seats ?? '-'} 座`}
            </View>
          </View>
          {priceLabel && (
            <Text className="trip-sheet__price">{priceLabel}</Text>
          )}
          {mode === 'driver' && (
            <Text className="trip-sheet__hint">
              司机端仅可查看，不可主动联系
            </Text>
          )}
          {mode === 'passenger' && (
            <Text className="trip-sheet__hint">确认同行后可联系司机</Text>
          )}
          <View className="trip-sheet__actions">
            <Button
              className="trip-sheet__btn"
              type="primary"
              onClick={() => openDetail(selected)}
            >
              查看详情
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
