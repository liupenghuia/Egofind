import Taro from '@tarojs/taro';
import { request } from '../services/request';

export type Place = {
  name: string;
  lat: number;
  lng: number;
  adcode: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  /** tencent | mock | fallback */
  source?: string;
};

const FALLBACK_ADCODE = process.env.TARO_APP_DEFAULT_ADCODE || '130128';

type ReverseGeo = {
  lat: number;
  lng: number;
  adcode: string;
  cityCode?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  recommend?: string;
  source?: string;
};

/**
 * 后端腾讯逆地理（无 Key 时服务端 mock）
 * 登录后优先带 token；失败则静默回落默认 adcode
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeo | null> {
  try {
    const data = await request<ReverseGeo>(
      `/map/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      { method: 'GET', auth: true },
    );
    return data;
  } catch {
    try {
      // 未登录时也允许（若后端 Public 未开则仍失败）
      return await request<ReverseGeo>(
        `/map/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
        { method: 'GET', auth: false },
      );
    } catch {
      return null;
    }
  }
}

/**
 * Open WeChat native location picker + reverse geocode for real adcode.
 */
export async function choosePlace(title = '选择地点'): Promise<Place> {
  try {
    Taro.showLoading({ title: '选点中', mask: true });
    const res = await Taro.chooseLocation({});
    const lat = res.latitude;
    const lng = res.longitude;
    const nameFromWx = res.name || res.address || title;

    Taro.showLoading({ title: '解析区县…', mask: true });
    const geo = await reverseGeocode(lat, lng);
    Taro.hideLoading();

    if (geo?.adcode) {
      return {
        name: nameFromWx || geo.recommend || geo.address || title,
        lat,
        lng,
        adcode: geo.adcode,
        address: geo.address,
        province: geo.province,
        city: geo.city,
        district: geo.district,
        source: geo.source,
      };
    }

    Taro.showToast({
      title: `区县解析失败，使用默认 ${FALLBACK_ADCODE}`,
      icon: 'none',
      duration: 2000,
    });
    return {
      name: nameFromWx,
      lat,
      lng,
      adcode: FALLBACK_ADCODE,
      source: 'fallback',
    };
  } catch (e) {
    Taro.hideLoading();
    if (String(e).includes('cancelled') || String(e).includes('cancel')) {
      Taro.showToast({ title: '已取消选点', icon: 'none' });
    } else {
      Taro.showToast({ title: '已取消选点或无权限', icon: 'none' });
    }
    throw new Error('chooseLocation cancelled');
  }
}

/** 当前定位 + 逆地理（地图页筛选用） */
export async function locateCurrentPlace(): Promise<Place | null> {
  try {
    const loc = await Taro.getLocation({ type: 'gcj02' });
    const geo = await reverseGeocode(loc.latitude, loc.longitude);
    return {
      name: geo?.recommend || geo?.address || '当前位置',
      lat: loc.latitude,
      lng: loc.longitude,
      adcode: geo?.adcode || FALLBACK_ADCODE,
      address: geo?.address,
      source: geo?.source || 'fallback',
    };
  } catch {
    return null;
  }
}
