/**
 * Parcel seed data. Market blocks are shaped like their eventual live sources:
 *  - sources.rezy             -> rezy.in locality API (e.g. rezy.in/locality/46)
 *  - sources.magicbricksComps -> MagicBricks project detail pages
 * Finance verdicts are computed by the API at read time from the real
 * ASBL portfolio cashflow (see engine.ts + finance-data.ts).
 */
export type ParcelStatus = "undeveloped" | "partial" | "developed";

export interface RezyLocalitySnapshot {
  source: "rezy.in";
  localityId: number;
  url: string;
  locality: string;
  avgPricePerSqft: number; // apartment asking, locality average
  yoyGrowthPct: number;
  fetchedAt: string;
}

export interface MagicBricksComp {
  source: "magicbricks";
  name: string;
  url: string;
  pricePerSqft: number; // asking
  configs: string; // e.g. "2,3 BHK"
  possession: string;
  distanceKm: number;
}

export interface Parcel {
  id: string;
  name: string;
  area: string;
  acres: number;
  status: ParcelStatus;
  category: string; // "Residential Zone" | "Agricultural" | "Mixed-Use" | "Commercial Zone"
  /** land asking rate, ₹ per sft of land */
  pricePerSft: number;
  /** apartment selling benchmark for the micro-market, ₹/sft (from rezy + comps) */
  areaRatePerSft: number;
  priceTrend: { year: number; price: number }[]; // apartment ₹/sft trend
  demographics: { schools: number; hospitals: number; malls: number; metroKm: number; highwayKm: number };
  corridors: string[];
  flatMix: { config: string; share: number }[];
  customerBase: { segment: string; share: number }[];
  limitations: string[];
  /** hard stop — construction prohibited (e.g. FTL buffer). Overrides everything. */
  blocked?: boolean;
  blockedReason?: string;
  financeApproved: boolean;
  financeNote: string;
  landOutlayCr: number;
  /** map geometry, [lat, lng] ring */
  polygon: [number, number][];
  sources: {
    rezy: RezyLocalitySnapshot;
    magicbricksComps: MagicBricksComp[];
  };
}

/** Lake Full Tank Level buffers — construction prohibited (HMDA). */
export const FTL_ZONES: { id: string; name: string; note: string; polygon: [number, number][] }[] = [
  {
    id: "osman-sagar-ftl",
    name: "Osman Sagar FTL + buffer",
    note: "GO 111 / FTL buffer — construction prohibited",
    polygon: [
      [17.395, 78.284],
      [17.394, 78.301],
      [17.387, 78.306],
      [17.378, 78.303],
      [17.372, 78.293],
      [17.374, 78.282],
      [17.383, 78.278],
    ],
  },
];

const FETCHED = "2026-06-11T18:30:00Z";

type Draft = Omit<Parcel, "financeApproved" | "financeNote" | "landOutlayCr">;

const DRAFTS: Draft[] = [
  {
    id: "kokapet",
    name: "Kokapet Greenfield",
    area: "Kokapet, Hyderabad",
    acres: 12.4,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 9800,
    areaRatePerSft: 10800,
    priceTrend: [
      { year: 2020, price: 4200 },
      { year: 2021, price: 5100 },
      { year: 2022, price: 6400 },
      { year: 2023, price: 7800 },
      { year: 2024, price: 9100 },
      { year: 2025, price: 10800 },
    ],
    demographics: { schools: 14, hospitals: 6, malls: 3, metroKm: 4.2, highwayKm: 1.1 },
    corridors: ["ORR Phase 2 widening", "Kokapet SEZ expansion", "Metro Blue Line ext."],
    flatMix: [
      { config: "2BHK", share: 25 },
      { config: "3BHK", share: 48 },
      { config: "4BHK", share: 22 },
      { config: "Penthouse", share: 5 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 46 },
      { segment: "NRI Investors", share: 24 },
      { segment: "Business Owners", share: 18 },
      { segment: "Others", share: 12 },
    ],
    limitations: ["Mild slope on north edge", "HMDA setback 9m"],
    polygon: [
      [17.3985, 78.3348],
      [17.3982, 78.3372],
      [17.3962, 78.3375],
      [17.3957, 78.3352],
      [17.3970, 78.3344],
    ],
    sources: {
      rezy: {
        source: "rezy.in",
        localityId: 46,
        url: "https://rezy.in/locality/46",
        locality: "Kokapet",
        avgPricePerSqft: 10800,
        yoyGrowthPct: 18.7,
        fetchedAt: FETCHED,
      },
      magicbricksComps: [
        {
          source: "magicbricks",
          name: "My Home Apas",
          url: "https://www.magicbricks.com/my-home-apas-kokapet-hyderabad-pdpid-4d4235303336363937",
          pricePerSqft: 11400,
          configs: "3,4 BHK",
          possession: "Dec 2026",
          distanceKm: 1.2,
        },
        {
          source: "magicbricks",
          name: "Rajapushpa Pristinia",
          url: "https://www.magicbricks.com/rajapushpa-pristinia-kokapet-hyderabad-pdpid-4d4235303939383433",
          pricePerSqft: 10200,
          configs: "2,3 BHK",
          possession: "Ready",
          distanceKm: 1.8,
        },
        {
          source: "magicbricks",
          name: "Candeur Skyline",
          url: "https://www.magicbricks.com/candeur-skyline-kokapet-hyderabad-pdpid-4d4235313041313233",
          pricePerSqft: 10750,
          configs: "3 BHK",
          possession: "Jun 2027",
          distanceKm: 2.4,
        },
      ],
    },
  },
  {
    id: "tellapur",
    name: "Tellapur North Block",
    area: "Tellapur, Hyderabad",
    acres: 18.7,
    status: "undeveloped",
    category: "Agricultural",
    pricePerSft: 5400,
    areaRatePerSft: 7200,
    priceTrend: [
      { year: 2020, price: 2300 },
      { year: 2021, price: 2700 },
      { year: 2022, price: 3500 },
      { year: 2023, price: 4300 },
      { year: 2024, price: 4900 },
      { year: 2025, price: 5400 },
    ],
    demographics: { schools: 8, hospitals: 3, malls: 1, metroKm: 9.4, highwayKm: 2.3 },
    corridors: ["Regional Ring Road", "Patancheru–Shankarpally corridor"],
    flatMix: [
      { config: "2BHK", share: 42 },
      { config: "3BHK", share: 44 },
      { config: "4BHK", share: 12 },
      { config: "Penthouse", share: 2 },
    ],
    customerBase: [
      { segment: "Mid-segment IT", share: 52 },
      { segment: "Govt Employees", share: 20 },
      { segment: "Local Business", share: 16 },
      { segment: "Others", share: 12 },
    ],
    limitations: ["Land-use conversion required (Agri → Resi)", "Power line easement strip"],
    polygon: [
      [17.4702, 78.2662],
      [17.4699, 78.2698],
      [17.4668, 78.2702],
      [17.4662, 78.2670],
      [17.4682, 78.2658],
    ],
    sources: {
      rezy: {
        source: "rezy.in",
        localityId: 112,
        url: "https://rezy.in/locality/112",
        locality: "Tellapur",
        avgPricePerSqft: 7200,
        yoyGrowthPct: 19.7,
        fetchedAt: FETCHED,
      },
      magicbricksComps: [
        {
          source: "magicbricks",
          name: "Vision Arsha",
          url: "https://www.magicbricks.com/vision-arsha-tellapur-hyderabad-pdpid-4d4235303731353539",
          pricePerSqft: 7600,
          configs: "2,3 BHK",
          possession: "Mar 2027",
          distanceKm: 1.5,
        },
        {
          source: "magicbricks",
          name: "Aparna Synergy",
          url: "https://www.magicbricks.com/aparna-synergy-tellapur-hyderabad-pdpid-4d4235303938373131",
          pricePerSqft: 6900,
          configs: "2,3 BHK",
          possession: "Ready",
          distanceKm: 2.1,
        },
      ],
    },
  },
  {
    id: "narsingi",
    name: "Narsingi Ridge",
    area: "Narsingi, Hyderabad",
    acres: 8.9,
    status: "partial",
    category: "Mixed-Use",
    pricePerSft: 11200,
    areaRatePerSft: 11600,
    priceTrend: [
      { year: 2020, price: 5400 },
      { year: 2021, price: 6300 },
      { year: 2022, price: 7700 },
      { year: 2023, price: 9200 },
      { year: 2024, price: 10500 },
      { year: 2025, price: 11600 },
    ],
    demographics: { schools: 11, hospitals: 5, malls: 2, metroKm: 5.8, highwayKm: 0.6 },
    corridors: ["ORR service road upgrade", "Neopolis layout phase 2"],
    flatMix: [
      { config: "2BHK", share: 18 },
      { config: "3BHK", share: 46 },
      { config: "4BHK", share: 28 },
      { config: "Penthouse", share: 8 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 41 },
      { segment: "NRI Investors", share: 30 },
      { segment: "Business Owners", share: 19 },
      { segment: "Others", share: 10 },
    ],
    limitations: ["Partial structures on south plot — demolition cost", "Rocky strata: deeper foundations"],
    polygon: [
      [17.3884, 78.3556],
      [17.3881, 78.3582],
      [17.3859, 78.3585],
      [17.3856, 78.3560],
    ],
    sources: {
      rezy: {
        source: "rezy.in",
        localityId: 58,
        url: "https://rezy.in/locality/58",
        locality: "Narsingi",
        avgPricePerSqft: 11600,
        yoyGrowthPct: 16.2,
        fetchedAt: FETCHED,
      },
      magicbricksComps: [
        {
          source: "magicbricks",
          name: "My Home Bhooja",
          url: "https://www.magicbricks.com/my-home-bhooja-hitech-city-hyderabad-pdpid-4d4235313237393139",
          pricePerSqft: 13800,
          configs: "3,4 BHK",
          possession: "Ready",
          distanceKm: 6.4,
        },
        {
          source: "magicbricks",
          name: "Sumadhura Epitome",
          url: "https://www.magicbricks.com/sumadhura-epitome-narsingi-hyderabad-pdpid-4d4235313130323435",
          pricePerSqft: 11900,
          configs: "3 BHK",
          possession: "Sep 2026",
          distanceKm: 1.1,
        },
      ],
    },
  },
  {
    id: "shankarpally",
    name: "Shankarpally Fields",
    area: "Shankarpally, Hyderabad",
    acres: 24.1,
    status: "undeveloped",
    category: "Agricultural",
    pricePerSft: 3200,
    areaRatePerSft: 5200,
    priceTrend: [
      { year: 2020, price: 1600 },
      { year: 2021, price: 1900 },
      { year: 2022, price: 2500 },
      { year: 2023, price: 3300 },
      { year: 2024, price: 4400 },
      { year: 2025, price: 5200 },
    ],
    demographics: { schools: 5, hospitals: 2, malls: 0, metroKm: 16.2, highwayKm: 3.8 },
    corridors: ["Regional Ring Road (west arc)", "MMTS extension proposal"],
    flatMix: [
      { config: "2BHK", share: 51 },
      { config: "3BHK", share: 39 },
      { config: "4BHK", share: 9 },
      { config: "Penthouse", share: 1 },
    ],
    customerBase: [
      { segment: "First-time Buyers", share: 48 },
      { segment: "Mid-segment IT", share: 27 },
      { segment: "Investors", share: 15 },
      { segment: "Others", share: 10 },
    ],
    limitations: ["NALA conversion pending", "Approach road is single-lane (widening proposed)"],
    polygon: [
      [17.4528, 78.1288],
      [17.4524, 78.1332],
      [17.4488, 78.1338],
      [17.4482, 78.1294],
      [17.4504, 78.1282],
    ],
    sources: {
      rezy: {
        source: "rezy.in",
        localityId: 203,
        url: "https://rezy.in/locality/203",
        locality: "Shankarpally",
        avgPricePerSqft: 5200,
        yoyGrowthPct: 18.1,
        fetchedAt: FETCHED,
      },
      magicbricksComps: [
        {
          source: "magicbricks",
          name: "Suchirindia Timberleaf",
          url: "https://www.magicbricks.com/suchirindia-timberleaf-shankarpally-hyderabad-pdpid-4d4235303636323139",
          pricePerSqft: 5600,
          configs: "Villas, 3 BHK",
          possession: "Dec 2027",
          distanceKm: 2.6,
        },
      ],
    },
  },
  {
    id: "gachibowli",
    name: "Gachibowli Infill",
    area: "Gachibowli, Hyderabad",
    acres: 4.3,
    status: "developed",
    category: "Commercial Zone",
    pricePerSft: 14500,
    areaRatePerSft: 13200,
    priceTrend: [
      { year: 2020, price: 7200 },
      { year: 2021, price: 8100 },
      { year: 2022, price: 9600 },
      { year: 2023, price: 11000 },
      { year: 2024, price: 12300 },
      { year: 2025, price: 13200 },
    ],
    demographics: { schools: 19, hospitals: 9, malls: 5, metroKm: 1.8, highwayKm: 0.9 },
    corridors: ["Metro Phase 2B", "Financial District grid roads"],
    flatMix: [
      { config: "2BHK", share: 22 },
      { config: "3BHK", share: 50 },
      { config: "4BHK", share: 24 },
      { config: "Penthouse", share: 4 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 55 },
      { segment: "NRI Investors", share: 22 },
      { segment: "Business Owners", share: 14 },
      { segment: "Others", share: 9 },
    ],
    limitations: ["Existing structures — demolition & debris", "Commercial zoning: resi needs change of use"],
    polygon: [
      [17.4412, 78.3472],
      [17.4410, 78.3490],
      [17.4396, 78.3492],
      [17.4394, 78.3474],
    ],
    sources: {
      rezy: {
        source: "rezy.in",
        localityId: 31,
        url: "https://rezy.in/locality/31",
        locality: "Gachibowli",
        avgPricePerSqft: 13200,
        yoyGrowthPct: 11.4,
        fetchedAt: FETCHED,
      },
      magicbricksComps: [
        {
          source: "magicbricks",
          name: "My Home Bhooja",
          url: "https://www.magicbricks.com/my-home-bhooja-hitech-city-hyderabad-pdpid-4d4235313237393139",
          pricePerSqft: 13800,
          configs: "3,4 BHK",
          possession: "Ready",
          distanceKm: 2.2,
        },
      ],
    },
  },
  {
    id: "gandipet",
    name: "Gandipet Lakefront",
    area: "Gandipet, Hyderabad",
    acres: 9.6,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 7500,
    areaRatePerSft: 9400,
    priceTrend: [
      { year: 2020, price: 4100 },
      { year: 2021, price: 4800 },
      { year: 2022, price: 6000 },
      { year: 2023, price: 7300 },
      { year: 2024, price: 8500 },
      { year: 2025, price: 9400 },
    ],
    demographics: { schools: 9, hospitals: 4, malls: 1, metroKm: 8.1, highwayKm: 1.4 },
    corridors: ["ORR exit 17 upgrade"],
    flatMix: [
      { config: "2BHK", share: 20 },
      { config: "3BHK", share: 45 },
      { config: "4BHK", share: 27 },
      { config: "Penthouse", share: 8 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 38 },
      { segment: "NRI Investors", share: 32 },
      { segment: "Business Owners", share: 20 },
      { segment: "Others", share: 10 },
    ],
    limitations: [
      "⛔ 72% of parcel inside Osman Sagar FTL buffer (GO 111)",
      "Construction prohibited — no HMDA approval possible",
    ],
    blocked: true,
    blockedReason: "72% of parcel falls inside the Osman Sagar FTL buffer — construction prohibited.",
    polygon: [
      [17.3905, 78.2952],
      [17.3902, 78.2978],
      [17.3880, 78.2982],
      [17.3876, 78.2956],
      [17.3890, 78.2946],
    ],
    sources: {
      rezy: {
        source: "rezy.in",
        localityId: 87,
        url: "https://rezy.in/locality/87",
        locality: "Gandipet",
        avgPricePerSqft: 9400,
        yoyGrowthPct: 14.9,
        fetchedAt: FETCHED,
      },
      magicbricksComps: [],
    },
  },
  {
    id: "kollur",
    name: "Kollur Mega Block",
    area: "Kollur, Hyderabad",
    acres: 35.0,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 6200,
    areaRatePerSft: 7800,
    priceTrend: [
      { year: 2020, price: 2900 },
      { year: 2021, price: 3400 },
      { year: 2022, price: 4400 },
      { year: 2023, price: 5600 },
      { year: 2024, price: 6900 },
      { year: 2025, price: 7800 },
    ],
    demographics: { schools: 7, hospitals: 3, malls: 1, metroKm: 12.6, highwayKm: 0.8 },
    corridors: ["ORR Kollur exit", "Neopolis spillover", "Mumbai highway logistics belt"],
    flatMix: [
      { config: "2BHK", share: 38 },
      { config: "3BHK", share: 47 },
      { config: "4BHK", share: 13 },
      { config: "Penthouse", share: 2 },
    ],
    customerBase: [
      { segment: "Mid-segment IT", share: 49 },
      { segment: "First-time Buyers", share: 24 },
      { segment: "Investors", share: 17 },
      { segment: "Others", share: 10 },
    ],
    limitations: ["Two seasonal nala crossings — culvert cost", "Phase-gated approvals likely (size)"],
    polygon: [
      [17.4790, 78.2188],
      [17.4786, 78.2246],
      [17.4738, 78.2252],
      [17.4730, 78.2194],
      [17.4760, 78.2180],
    ],
    sources: {
      rezy: {
        source: "rezy.in",
        localityId: 134,
        url: "https://rezy.in/locality/134",
        locality: "Kollur",
        avgPricePerSqft: 7800,
        yoyGrowthPct: 21.3,
        fetchedAt: FETCHED,
      },
      magicbricksComps: [
        {
          source: "magicbricks",
          name: "Sattva Lakeridge",
          url: "https://www.magicbricks.com/sattva-lakeridge-neopolis-hyderabad-pdpid-4d4235313139333537",
          pricePerSqft: 8400,
          configs: "3,4 BHK",
          possession: "Dec 2028",
          distanceKm: 3.9,
        },
        {
          source: "magicbricks",
          name: "Godrej Madison Avenue",
          url: "https://www.magicbricks.com/godrej-madison-avenue-kokapet-hyderabad-pdpid-4d4235313037353531",
          pricePerSqft: 9100,
          configs: "3 BHK",
          possession: "Jun 2028",
          distanceKm: 5.2,
        },
      ],
    },
  },
];


export const PARCEL_DRAFTS: Draft[] = DRAFTS;

export function parcelCentroid(polygon: [number, number][]): [number, number] {
  const lat = polygon.reduce((s, c) => s + c[0], 0) / polygon.length;
  const lng = polygon.reduce((s, c) => s + c[1], 0) / polygon.length;
  return [lat, lng];
}
