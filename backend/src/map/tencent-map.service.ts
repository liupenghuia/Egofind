import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ReverseGeocodeResult = {
  lat: number;
  lng: number;
  /** 国标 6 位 adcode（区/县） */
  adcode: string;
  /** 市级 4 位前缀 */
  cityCode: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  recommend?: string;
  /** 数据来源：tencent | mock | fallback */
  source: 'tencent' | 'mock' | 'fallback';
  /**
   * 是否可用于匹配/发单区县过滤。
   * tencent 恒为 true；mock 仅当 ALLOW_MOCK_GEO 允许；fallback 恒 false。
   */
  matchReady: boolean;
  /** 不可用于匹配时的说明（可展示给用户） */
  matchBlockReason?: string;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  adcode: string;
  cityCode: string;
  title?: string;
  address?: string;
  source: 'tencent' | 'mock' | 'fallback';
  matchReady: boolean;
  matchBlockReason?: string;
};

/** 粗略 bbox 演示点（仅 mock） */
const MOCK_REGIONS: { adcode: string; name: string; lat: number; lng: number; rKm: number }[] = [
  { adcode: '130128', name: '河北省石家庄市深泽县', lat: 38.184, lng: 115.201, rKm: 25 },
  { adcode: '110108', name: '北京市海淀区', lat: 39.96, lng: 116.3, rKm: 15 },
  { adcode: '310115', name: '上海市浦东新区', lat: 31.22, lng: 121.54, rKm: 20 },
  { adcode: '440305', name: '广东省深圳市南山区', lat: 22.53, lng: 113.93, rKm: 12 },
];

@Injectable()
export class TencentMapService {
  private readonly logger = new Logger(TencentMapService.name);
  private readonly cache = new Map<string, { exp: number; value: ReverseGeocodeResult }>();

  constructor(private readonly config: ConfigService) {}

  private key(): string | null {
    const k = this.config.get<string>('TENCENT_MAP_KEY') || '';
    if (!k || k.startsWith('your-') || k === 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77') {
      // demo key from docs not for production; treat as unset unless FORCE
      if (k === 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77') return k;
      return null;
    }
    return k;
  }

  private fallbackAdcode(): string {
    return this.config.get<string>('DEFAULT_ADCODE') || '130128';
  }

  isConfigured(): boolean {
    return !!this.key();
  }

  /**
   * 是否允许 mock 逆地理参与匹配。
   * ALLOW_MOCK_GEO=1 强制开；=0 强制关；未设时非 production 默认开（本地演示）。
   */
  allowMockGeo(): boolean {
    const flag = this.config.get<string>('ALLOW_MOCK_GEO');
    if (flag === '1') return true;
    if (flag === '0') return false;
    return process.env.NODE_ENV !== 'production';
  }

  /** 根据 source 判定能否用于匹配区县 */
  attachMatchMeta<T extends { source: ReverseGeocodeResult['source'] }>(
    result: T,
  ): T & { matchReady: boolean; matchBlockReason?: string } {
    if (result.source === 'tencent') {
      return { ...result, matchReady: true };
    }
    if (result.source === 'mock') {
      if (this.allowMockGeo()) {
        return {
          ...result,
          matchReady: true,
          matchBlockReason:
            '当前为演示逆地理（未配置腾讯 Key 或调用失败），仅限开发/演示环境',
        };
      }
      return {
        ...result,
        matchReady: false,
        matchBlockReason:
          '地图服务未正确配置，无法解析真实区县，请联系管理员配置 TENCENT_MAP_KEY',
      };
    }
    return {
      ...result,
      matchReady: false,
      matchBlockReason: '区县解析失败，无法用于附近匹配，请重试定位或重新选点',
    };
  }

  /**
   * 规范化 adcode：优先 6 位区县码；非法则回落默认。
   */
  normalizeAdcode(raw?: string | null): string {
    if (!raw) return this.fallbackAdcode();
    const s = String(raw).replace(/\D/g, '');
    if (s.length >= 6) return s.slice(0, 6);
    if (s.length === 4) return `${s}00`; // 市级补 00
    return this.fallbackAdcode();
  }

  cityCodeOf(adcode: string): string {
    return this.normalizeAdcode(adcode).slice(0, 4);
  }

  /** 是否需要服务端补全（空、占位、明显无效） */
  needsEnrichment(adcode?: string | null): boolean {
    if (!adcode) return true;
    const s = String(adcode).replace(/\D/g, '');
    if (s.length < 6) return true;
    // 000000 等
    if (/^0+$/.test(s)) return true;
    return false;
  }

  private cacheKey(lat: number, lng: number): string {
    // ~11m 精度缓存，减少重复调用
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return this.fallbackResult(lat || 0, lng || 0);
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return this.fallbackResult(lat, lng);
    }

    const ck = this.cacheKey(lat, lng);
    const hit = this.cache.get(ck);
    if (hit && hit.exp > Date.now()) return hit.value;

    const key = this.key();
    let result: ReverseGeocodeResult;

    if (!key) {
      result = this.mockReverse(lat, lng);
    } else {
      try {
        result = await this.fetchTencentReverse(lat, lng, key);
      } catch (e) {
        this.logger.warn(`Tencent reverse failed: ${String(e)}`);
        result = this.mockReverse(lat, lng);
        result.source = result.source === 'mock' ? 'mock' : 'fallback';
      }
    }

    const withMeta = this.attachMatchMeta(result);
    this.cache.set(ck, {
      exp: Date.now() + 10 * 60 * 1000,
      value: withMeta,
    });
    // 简单限容
    if (this.cache.size > 500) {
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    return withMeta;
  }

  /**
   * 发布行程时：若 adcode 缺失/无效，用坐标逆地理补全；名称也可润色。
   */
  async enrichPlace(place: {
    name: string;
    lat: number;
    lng: number;
    adcode?: string;
  }): Promise<{ name: string; lat: number; lng: number; adcode: string; geo?: ReverseGeocodeResult }> {
    let adcode = place.adcode;
    let name = place.name;
    let geo: ReverseGeocodeResult | undefined;

    if (this.needsEnrichment(adcode)) {
      geo = await this.reverseGeocode(place.lat, place.lng);
      adcode = geo.adcode;
      if (!name || name.includes('可重选') || name.includes('点此')) {
        name = geo.recommend || geo.address || name;
      }
    } else {
      adcode = this.normalizeAdcode(adcode);
    }

    return {
      name: name || place.name,
      lat: place.lat,
      lng: place.lng,
      adcode: adcode!,
      geo,
    };
  }

  async geocode(address: string): Promise<GeocodeResult> {
    const key = this.key();
    if (!key) {
      const fb = this.fallbackAdcode();
      return this.attachMatchMeta({
        lat: 38.184,
        lng: 115.201,
        adcode: fb,
        cityCode: this.cityCodeOf(fb),
        title: address,
        address,
        source: 'mock' as const,
      });
    }

    const url = new URL('https://apis.map.qq.com/ws/geocoder/v1/');
    url.searchParams.set('address', address);
    url.searchParams.set('key', key);

    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      status: number;
      message?: string;
      result?: {
        title?: string;
        location?: { lat: number; lng: number };
        ad_info?: { adcode?: string };
        address_components?: {
          province?: string;
          city?: string;
          district?: string;
        };
      };
    };

    if (data.status !== 0 || !data.result?.location) {
      throw new Error(data.message || `geocode status ${data.status}`);
    }

    const adcode = this.normalizeAdcode(data.result.ad_info?.adcode);
    return this.attachMatchMeta({
      lat: data.result.location.lat,
      lng: data.result.location.lng,
      adcode,
      cityCode: this.cityCodeOf(adcode),
      title: data.result.title,
      address,
      source: 'tencent' as const,
    });
  }

  private async fetchTencentReverse(
    lat: number,
    lng: number,
    key: string,
  ): Promise<ReverseGeocodeResult> {
    const url = new URL('https://apis.map.qq.com/ws/geocoder/v1/');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('key', key);
    url.searchParams.set('get_poi', '0');

    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      status: number;
      message?: string;
      result?: {
        address?: string;
        formatted_addresses?: { recommend?: string; rough?: string };
        address_component?: {
          province?: string;
          city?: string;
          district?: string;
          adcode?: string;
        };
        ad_info?: {
          adcode?: string;
          nation_code?: string;
          city_code?: string;
          name?: string;
        };
      };
    };

    if (data.status !== 0 || !data.result) {
      throw new Error(data.message || `reverse status ${data.status}`);
    }

    const rawAdcode =
      data.result.ad_info?.adcode || data.result.address_component?.adcode || '';
    const adcode = this.normalizeAdcode(rawAdcode);

    return {
      lat,
      lng,
      adcode,
      cityCode: this.cityCodeOf(adcode),
      province: data.result.address_component?.province,
      city: data.result.address_component?.city,
      district: data.result.address_component?.district,
      address: data.result.address,
      recommend:
        data.result.formatted_addresses?.recommend ||
        data.result.formatted_addresses?.rough ||
        data.result.address,
      source: 'tencent',
      matchReady: true,
    };
  }

  private mockReverse(lat: number, lng: number): ReverseGeocodeResult {
    // 选最近演示区域
    let best = MOCK_REGIONS[0];
    let bestD = Number.POSITIVE_INFINITY;
    for (const r of MOCK_REGIONS) {
      const d = (lat - r.lat) ** 2 + (lng - r.lng) ** 2;
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    const adcode = best.adcode;
    return this.attachMatchMeta({
      lat,
      lng,
      adcode,
      cityCode: this.cityCodeOf(adcode),
      address: best.name,
      recommend: best.name,
      province: best.name.slice(0, 3),
      district: best.name,
      source: 'mock' as const,
    });
  }

  private fallbackResult(lat: number, lng: number): ReverseGeocodeResult {
    const adcode = this.fallbackAdcode();
    return this.attachMatchMeta({
      lat,
      lng,
      adcode,
      cityCode: this.cityCodeOf(adcode),
      address: '未知位置',
      recommend: '未知位置',
      source: 'fallback' as const,
    });
  }
}
