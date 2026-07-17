/** Haversine distance in kilometers */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function directionCosine(
  oLat1: number,
  oLng1: number,
  dLat1: number,
  dLng1: number,
  oLat2: number,
  oLng2: number,
  dLat2: number,
  dLng2: number,
): number {
  const v1x = dLng1 - oLng1;
  const v1y = dLat1 - oLat1;
  const v2x = dLng2 - oLng2;
  const v2y = dLat2 - oLat2;
  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  if (n1 === 0 || n2 === 0) return 0;
  return (v1x * v2x + v1y * v2y) / (n1 * n2);
}

export function timeOverlapRatio(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): number {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  if (end <= start) return 0;
  const inter = end - start;
  const shorter = Math.min(aEnd.getTime() - aStart.getTime(), bEnd.getTime() - bStart.getTime());
  if (shorter <= 0) return 0;
  return inter / shorter;
}

export function sameRegion(
  adcodeA: string,
  adcodeB: string,
  scope: 'county' | 'city' = 'county',
): boolean {
  if (!adcodeA || !adcodeB) return false;
  if (scope === 'city') {
    return adcodeA.slice(0, 4) === adcodeB.slice(0, 4);
  }
  return adcodeA === adcodeB;
}
