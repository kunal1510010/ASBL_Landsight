export function estimateAcres(polygon: [number, number][]): number {
  const n = polygon.length;
  if (n < 3) return 0;
  const R = 6378137;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dLng = (polygon[j][1] - polygon[i][1]) * (Math.PI / 180);
    const sinA = Math.sin(polygon[i][0] * (Math.PI / 180));
    const sinB = Math.sin(polygon[j][0] * (Math.PI / 180));
    area += dLng * (2 + sinA + sinB);
  }
  return (Math.abs(area) * R * R) / 2 / 4046.856;
}

export function centroid(polygon: [number, number][]): [number, number] {
  return [
    polygon.reduce((s, c) => s + c[0], 0) / polygon.length,
    polygon.reduce((s, c) => s + c[1], 0) / polygon.length,
  ];
}

export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * (Math.PI / 180);
  const dLng = (b[1] - a[1]) * (Math.PI / 180);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * (Math.PI / 180)) * Math.cos(b[0] * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
