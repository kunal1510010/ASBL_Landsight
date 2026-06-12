import type { Parcel } from "./types";
import { estimateAcres, centroid, distanceKm } from "./geo";

let seq = 0;

export function generateParcelFromPolygon(
  polygon: [number, number][],
  referenceParcels: Parcel[],
  name?: string,
): Parcel {
  const id = `custom-${++seq}`;
  const acres = Math.max(0.1, parseFloat(estimateAcres(polygon).toFixed(2)));
  const c = centroid(polygon);

  const ranked = referenceParcels
    .filter((p) => !p.blocked)
    .map((p) => ({ p, km: distanceKm(c, centroid(p.polygon)) }))
    .sort((a, b) => a.km - b.km);

  const ref = ranked[0]?.p ?? referenceParcels[0];
  if (!ref) throw new Error("No reference parcels available");

  // Inverse-distance weighted blend of price data from 1-2 nearest parcels
  const blend = ranked.slice(0, 2);
  const totalW = blend.reduce((s, { km }) => s + 1 / (km + 0.5), 0);
  const w = (km: number) => 1 / (km + 0.5) / totalW;

  const pricePerSft = Math.round(blend.reduce((s, { p, km }) => s + p.pricePerSft * w(km), 0));
  const areaRatePerSft = Math.round(blend.reduce((s, { p, km }) => s + p.areaRatePerSft * w(km), 0));
  const landOutlayCr = parseFloat(((acres * 43560 * pricePerSft) / 1e7).toFixed(2));

  const nearestComps = blend
    .flatMap(({ p, km }) =>
      p.sources.magicbricksComps.slice(0, 2).map((comp) => ({
        ...comp,
        distanceKm: parseFloat((comp.distanceKm + km * 0.5).toFixed(1)),
      })),
    )
    .slice(0, 4);

  const nearestKm = ranked[0]?.km ?? 0;

  return {
    id,
    name: name?.trim() || `Custom parcel (${acres.toFixed(1)} ac)`,
    area: ref.area,
    acres,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft,
    areaRatePerSft,
    priceTrend: ref.priceTrend,
    demographics: ref.demographics,
    corridors: ref.corridors,
    flatMix: ref.flatMix,
    customerBase: ref.customerBase,
    limitations: [],
    blocked: false,
    financeApproved: true,
    financeNote: `Indicative estimate based on ${ref.name} micro-market data (${nearestKm.toFixed(1)} km away). Verify with ground survey before committing.`,
    landOutlayCr,
    polygon,
    sources: {
      rezy: ref.sources.rezy,
      magicbricksComps: nearestComps,
    },
  };
}
