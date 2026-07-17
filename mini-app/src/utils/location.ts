import Taro from '@tarojs/taro';

export type Place = {
  name: string;
  lat: number;
  lng: number;
  adcode: string;
};

/** Default demo adcode when reverse-geocode is unavailable */
const FALLBACK_ADCODE = '130128';

/**
 * Open WeChat native location picker.
 * adcode: prefer result; fallback to env/demo county for matching layer.
 */
export async function choosePlace(title = '选择地点'): Promise<Place> {
  try {
    const res = await Taro.chooseLocation({});
    return {
      name: res.name || res.address || title,
      lat: res.latitude,
      lng: res.longitude,
      // chooseLocation 不返回 adcode；可后续用腾讯逆地理。MVP 用默认县域或全局配置
      adcode: process.env.TARO_APP_DEFAULT_ADCODE || FALLBACK_ADCODE,
    };
  } catch {
    Taro.showToast({ title: '已取消选点或无权限', icon: 'none' });
    throw new Error('chooseLocation cancelled');
  }
}
