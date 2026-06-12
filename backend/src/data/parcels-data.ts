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
  city: "Hyderabad" | "Bangalore" | "Mumbai";
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
    city: "Hyderabad",
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
    city: "Hyderabad",
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
    city: "Hyderabad",
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
    city: "Hyderabad",
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
    city: "Hyderabad",
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
    city: "Hyderabad",
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
    city: "Hyderabad",
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
  // Bangalore parcels
  {
    id: "sarjapur",
    city: "Bangalore",
    name: "Sarjapur Road Tech Corridor",
    area: "Sarjapur Road, Bangalore",
    acres: 14.2,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 7500,
    areaRatePerSft: 8200,
    priceTrend: [
      { year: 2020, price: 3800 }, { year: 2021, price: 4500 },
      { year: 2022, price: 5400 }, { year: 2023, price: 6400 },
      { year: 2024, price: 7200 }, { year: 2025, price: 8200 },
    ],
    demographics: { schools: 16, hospitals: 7, malls: 4, metroKm: 8.2, highwayKm: 1.4 },
    corridors: ["SE Tech Corridor expansion", "PRR (Peripheral Ring Road) eastern arc", "Hosur Road widening"],
    flatMix: [
      { config: "2BHK", share: 28 }, { config: "3BHK", share: 52 },
      { config: "4BHK", share: 17 }, { config: "Penthouse", share: 3 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 58 }, { segment: "NRI Investors", share: 20 },
      { segment: "Business Owners", share: 13 }, { segment: "Others", share: 9 },
    ],
    limitations: ["DC Conversion pending (Agri → Resi)", "Power line easement strip on west edge"],
    polygon: [
      [12.8692, 77.7184], [12.8690, 77.7214], [12.8664, 77.7218],
      [12.8661, 77.7188], [12.8676, 77.7178],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 501, url: "https://rezy.in/locality/501", locality: "Sarjapur Road", avgPricePerSqft: 8200, yoyGrowthPct: 16.8, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Prestige Finsbury Park", url: "https://www.magicbricks.com/prestige-finsbury-park-sarjapur-bangalore-pdpid-4d4235303031303032", pricePerSqft: 8900, configs: "2,3 BHK", possession: "Dec 2026", distanceKm: 1.8 },
        { source: "magicbricks", name: "Brigade Orchards", url: "https://www.magicbricks.com/brigade-orchards-devanahalli-bangalore-pdpid-4d4235303031303033", pricePerSqft: 7600, configs: "3,4 BHK", possession: "Ready", distanceKm: 3.2 },
      ],
    },
  },
  {
    id: "whitefield-blr",
    city: "Bangalore",
    name: "Whitefield IT Hub West",
    area: "Whitefield, Bangalore",
    acres: 9.8,
    status: "partial",
    category: "Mixed-Use",
    pricePerSft: 12800,
    areaRatePerSft: 9500,
    priceTrend: [
      { year: 2020, price: 5200 }, { year: 2021, price: 5900 },
      { year: 2022, price: 6800 }, { year: 2023, price: 7900 },
      { year: 2024, price: 8700 }, { year: 2025, price: 9500 },
    ],
    demographics: { schools: 22, hospitals: 11, malls: 6, metroKm: 1.2, highwayKm: 0.8 },
    corridors: ["Metro Purple Line station (0.8 km)", "ITPL Phase 4 expansion", "Outer Ring Road flyover"],
    flatMix: [
      { config: "2BHK", share: 22 }, { config: "3BHK", share: 54 },
      { config: "4BHK", share: 20 }, { config: "Penthouse", share: 4 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 62 }, { segment: "NRI Investors", share: 18 },
      { segment: "Business Owners", share: 12 }, { segment: "Others", share: 8 },
    ],
    limitations: ["Partial structures — demolition cost ~Rs 2 Cr", "Change of use needed (commercial → residential)"],
    polygon: [
      [12.9797, 77.7488], [12.9795, 77.7512], [12.9773, 77.7515],
      [12.9771, 77.7491],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 502, url: "https://rezy.in/locality/502", locality: "Whitefield", avgPricePerSqft: 9500, yoyGrowthPct: 14.2, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Sobha Dream Acres", url: "https://www.magicbricks.com/sobha-dream-acres-whitefield-bangalore-pdpid-4d4235303031303034", pricePerSqft: 9800, configs: "1,2 BHK", possession: "Ready", distanceKm: 1.4 },
        { source: "magicbricks", name: "Puravankara Purva Venezia", url: "https://www.magicbricks.com/puravankara-purva-venezia-whitefield-bangalore-pdpid-4d4235303031303035", pricePerSqft: 10200, configs: "3,4 BHK", possession: "Jun 2027", distanceKm: 2.1 },
      ],
    },
  },
  {
    id: "devanahalli",
    city: "Bangalore",
    name: "Devanahalli Aerospace Node",
    area: "Devanahalli, Bangalore",
    acres: 22.5,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 4200,
    areaRatePerSft: 6800,
    priceTrend: [
      { year: 2020, price: 2100 }, { year: 2021, price: 2600 },
      { year: 2022, price: 3400 }, { year: 2023, price: 4600 },
      { year: 2024, price: 5800 }, { year: 2025, price: 6800 },
    ],
    demographics: { schools: 8, hospitals: 3, malls: 1, metroKm: 18.4, highwayKm: 2.1 },
    corridors: ["KIAL (Airport) Aerotropolis zone", "NH 44 widening", "Devanahalli Business Park expansion"],
    flatMix: [
      { config: "2BHK", share: 38 }, { config: "3BHK", share: 48 },
      { config: "4BHK", share: 11 }, { config: "Penthouse", share: 3 },
    ],
    customerBase: [
      { segment: "Airport Staff & Expats", share: 34 }, { segment: "IT Professionals", share: 32 },
      { segment: "Investors", share: 22 }, { segment: "Others", share: 12 },
    ],
    limitations: ["AAI NOC required (airport proximity)", "DC Conversion from agricultural land"],
    polygon: [
      [13.2458, 77.7162], [13.2455, 77.7198], [13.2419, 77.7204],
      [13.2414, 77.7168], [13.2436, 77.7155],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 503, url: "https://rezy.in/locality/503", locality: "Devanahalli", avgPricePerSqft: 6800, yoyGrowthPct: 24.6, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Brigade Orchards", url: "https://www.magicbricks.com/brigade-orchards-devanahalli-bangalore-pdpid-4d4235303031303036", pricePerSqft: 7200, configs: "2,3 BHK", possession: "Dec 2027", distanceKm: 2.8 },
      ],
    },
  },
  {
    id: "kanakapura",
    city: "Bangalore",
    name: "Kanakapura Road South",
    area: "Kanakapura Road, Bangalore",
    acres: 16.8,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 5800,
    areaRatePerSft: 7100,
    priceTrend: [
      { year: 2020, price: 2800 }, { year: 2021, price: 3300 },
      { year: 2022, price: 4100 }, { year: 2023, price: 5200 },
      { year: 2024, price: 6200 }, { year: 2025, price: 7100 },
    ],
    demographics: { schools: 12, hospitals: 5, malls: 2, metroKm: 4.8, highwayKm: 1.2 },
    corridors: ["Metro Green Line extension (Anjanapura)", "PRR southern arc", "NICE Corridor"],
    flatMix: [
      { config: "2BHK", share: 35 }, { config: "3BHK", share: 50 },
      { config: "4BHK", share: 12 }, { config: "Penthouse", share: 3 },
    ],
    customerBase: [
      { segment: "Mid-segment IT", share: 44 }, { segment: "First-time Buyers", share: 28 },
      { segment: "Investors", share: 18 }, { segment: "Others", share: 10 },
    ],
    limitations: ["PTCL NOC check required (SC/ST land verification)", "Rajakaluve buffer on eastern boundary"],
    polygon: [
      [12.8512, 77.5698], [12.8509, 77.5730], [12.8479, 77.5735],
      [12.8475, 77.5703], [12.8494, 77.5692],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 504, url: "https://rezy.in/locality/504", locality: "Kanakapura Road", avgPricePerSqft: 7100, yoyGrowthPct: 19.4, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Godrej Woodscapes", url: "https://www.magicbricks.com/godrej-woodscapes-kanakapura-bangalore-pdpid-4d4235303031303037", pricePerSqft: 7600, configs: "2,3 BHK", possession: "Mar 2027", distanceKm: 2.4 },
        { source: "magicbricks", name: "Assetz Earthy & Serene", url: "https://www.magicbricks.com/assetz-earthy-serene-kanakapura-bangalore-pdpid-4d4235303031303038", pricePerSqft: 6900, configs: "3 BHK", possession: "Jun 2027", distanceKm: 3.1 },
      ],
    },
  },
  {
    id: "hebbal-blr",
    city: "Bangalore",
    name: "Hebbal Lakeview Pocket",
    area: "Hebbal, Bangalore",
    acres: 6.4,
    status: "partial",
    category: "Residential Zone",
    pricePerSft: 14500,
    areaRatePerSft: 12000,
    priceTrend: [
      { year: 2020, price: 6100 }, { year: 2021, price: 7200 },
      { year: 2022, price: 8600 }, { year: 2023, price: 9800 },
      { year: 2024, price: 11000 }, { year: 2025, price: 12000 },
    ],
    demographics: { schools: 18, hospitals: 10, malls: 5, metroKm: 2.4, highwayKm: 0.6 },
    corridors: ["NH 44 (Bellary Road) upgrade", "Metro Yellow Line extension", "Hebbal flyover expansion"],
    flatMix: [
      { config: "2BHK", share: 15 }, { config: "3BHK", share: 48 },
      { config: "4BHK", share: 30 }, { config: "Penthouse", share: 7 },
    ],
    customerBase: [
      { segment: "Senior IT / CXO", share: 42 }, { segment: "NRI Investors", share: 28 },
      { segment: "Business Owners", share: 22 }, { segment: "Others", share: 8 },
    ],
    limitations: ["Lake buffer zone on north side (30m)", "Partial construction requires demolition clearance"],
    polygon: [
      [13.0348, 77.5942], [13.0346, 77.5966], [13.0326, 77.5968],
      [13.0324, 77.5944],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 505, url: "https://rezy.in/locality/505", locality: "Hebbal", avgPricePerSqft: 12000, yoyGrowthPct: 12.8, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Prestige Lakeside Habitat", url: "https://www.magicbricks.com/prestige-lakeside-habitat-whitefield-bangalore-pdpid-4d4235303031303039", pricePerSqft: 12800, configs: "3,4 BHK", possession: "Ready", distanceKm: 2.8 },
      ],
    },
  },
  {
    id: "thanisandra",
    city: "Bangalore",
    name: "Thanisandra Main Road",
    area: "Thanisandra, Bangalore",
    acres: 8.1,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 9200,
    areaRatePerSft: 8800,
    priceTrend: [
      { year: 2020, price: 4200 }, { year: 2021, price: 4900 },
      { year: 2022, price: 5900 }, { year: 2023, price: 7200 },
      { year: 2024, price: 8000 }, { year: 2025, price: 8800 },
    ],
    demographics: { schools: 14, hospitals: 6, malls: 3, metroKm: 3.1, highwayKm: 1.8 },
    corridors: ["Metro Green Line Phase 3 (Nagavara)", "Stonehill International corridor", "STRR northern arc"],
    flatMix: [
      { config: "2BHK", share: 32 }, { config: "3BHK", share: 52 },
      { config: "4BHK", share: 13 }, { config: "Penthouse", share: 3 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 52 }, { segment: "Mid-segment Families", share: 26 },
      { segment: "Investors", share: 14 }, { segment: "Others", share: 8 },
    ],
    limitations: ["BESCOM high-tension line — 22m setback", "B-Khata conversion needed before BDA sanction"],
    polygon: [
      [13.0614, 77.6272], [13.0612, 77.6298], [13.0590, 77.6301],
      [13.0588, 77.6275],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 506, url: "https://rezy.in/locality/506", locality: "Thanisandra", avgPricePerSqft: 8800, yoyGrowthPct: 17.6, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Mana Dale", url: "https://www.magicbricks.com/mana-dale-thanisandra-bangalore-pdpid-4d4235303031303131", pricePerSqft: 8600, configs: "2,3 BHK", possession: "Dec 2026", distanceKm: 1.2 },
        { source: "magicbricks", name: "Concorde Neopolis", url: "https://www.magicbricks.com/concorde-neopolis-thanisandra-bangalore-pdpid-4d4235303031303132", pricePerSqft: 9200, configs: "3 BHK", possession: "Jun 2027", distanceKm: 2.6 },
      ],
    },
  },
  {
    id: "yelahanka",
    city: "Bangalore",
    name: "Yelahanka New Town Block",
    area: "Yelahanka, Bangalore",
    acres: 18.3,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 4800,
    areaRatePerSft: 6500,
    priceTrend: [
      { year: 2020, price: 2400 }, { year: 2021, price: 2900 },
      { year: 2022, price: 3700 }, { year: 2023, price: 4900 },
      { year: 2024, price: 5800 }, { year: 2025, price: 6500 },
    ],
    demographics: { schools: 10, hospitals: 4, malls: 2, metroKm: 6.8, highwayKm: 2.2 },
    corridors: ["NH 44 Yelahanka bypass", "STRR Phase 2", "Air Force Station adjacency premium"],
    flatMix: [
      { config: "2BHK", share: 44 }, { config: "3BHK", share: 44 },
      { config: "4BHK", share: 10 }, { config: "Penthouse", share: 2 },
    ],
    customerBase: [
      { segment: "Defence Personnel", share: 28 }, { segment: "IT Professionals", share: 34 },
      { segment: "First-time Buyers", share: 24 }, { segment: "Others", share: 14 },
    ],
    limitations: ["AAI proximity NOC required", "Phase-gated approvals recommended (size)"],
    polygon: [
      [13.1012, 77.5958], [13.1008, 77.5996], [13.0970, 77.6001],
      [13.0965, 77.5963], [13.0988, 77.5950],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 507, url: "https://rezy.in/locality/507", locality: "Yelahanka", avgPricePerSqft: 6500, yoyGrowthPct: 21.2, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Provident Park Square", url: "https://www.magicbricks.com/provident-park-square-yelahanka-bangalore-pdpid-4d4235303031303133", pricePerSqft: 6800, configs: "2,3 BHK", possession: "Sep 2027", distanceKm: 3.4 },
      ],
    },
  },
  {
    id: "balagere",
    city: "Bangalore",
    name: "Balagere Road East",
    area: "Balagere, Bangalore",
    acres: 11.6,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 6900,
    areaRatePerSft: 7600,
    priceTrend: [
      { year: 2020, price: 3200 }, { year: 2021, price: 3900 },
      { year: 2022, price: 4900 }, { year: 2023, price: 6100 },
      { year: 2024, price: 7000 }, { year: 2025, price: 7600 },
    ],
    demographics: { schools: 13, hospitals: 5, malls: 3, metroKm: 5.6, highwayKm: 1.1 },
    corridors: ["Balagere-Varthur Road widening", "SE Bengaluru tech spillover", "PRR eastern sector"],
    flatMix: [
      { config: "2BHK", share: 30 }, { config: "3BHK", share: 55 },
      { config: "4BHK", share: 12 }, { config: "Penthouse", share: 3 },
    ],
    customerBase: [
      { segment: "IT Professionals", share: 56 }, { segment: "NRI Investors", share: 22 },
      { segment: "Investors", share: 14 }, { segment: "Others", share: 8 },
    ],
    limitations: ["Rajakaluve storm drain — 30m buffer on south", "E-Khata A-to-B conversion pending for 2 sub-plots"],
    polygon: [
      [12.9842, 77.7548], [12.9840, 77.7574], [12.9816, 77.7577],
      [12.9814, 77.7551],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 508, url: "https://rezy.in/locality/508", locality: "Balagere", avgPricePerSqft: 7600, yoyGrowthPct: 18.3, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Nester Aurelia", url: "https://www.magicbricks.com/nester-aurelia-balagere-bangalore-pdpid-4d4235303031303134", pricePerSqft: 7900, configs: "3 BHK", possession: "Mar 2028", distanceKm: 1.6 },
      ],
    },
  },
  // Mumbai parcels
  {
    id: "panvel",
    city: "Mumbai",
    name: "Panvel Gateway Sector",
    area: "Panvel, Mumbai",
    acres: 28.4,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 5200,
    areaRatePerSft: 8500,
    priceTrend: [
      { year: 2020, price: 3800 }, { year: 2021, price: 4400 },
      { year: 2022, price: 5600 }, { year: 2023, price: 6800 },
      { year: 2024, price: 7800 }, { year: 2025, price: 8500 },
    ],
    demographics: { schools: 14, hospitals: 6, malls: 3, metroKm: 2.8, highwayKm: 0.9 },
    corridors: ["NMIA Navi Mumbai Airport (2026)", "Trans-Harbour Link operational", "Mumbai-Pune Expressway spur"],
    flatMix: [
      { config: "2BHK", share: 42 }, { config: "3BHK", share: 44 },
      { config: "4BHK", share: 11 }, { config: "Penthouse", share: 3 },
    ],
    customerBase: [
      { segment: "Airport Workforce", share: 32 }, { segment: "Mid-segment Families", share: 36 },
      { segment: "Investors", share: 22 }, { segment: "Others", share: 10 },
    ],
    limitations: ["NA Order (District Collector) required", "SEIAA Maharashtra clearance — 6-8 month timeline"],
    polygon: [
      [18.9972, 73.1082], [18.9969, 73.1118], [18.9933, 73.1124],
      [18.9928, 73.1088], [18.9950, 73.1075],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 601, url: "https://rezy.in/locality/601", locality: "Panvel", avgPricePerSqft: 8500, yoyGrowthPct: 22.4, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Godrej Nurture", url: "https://www.magicbricks.com/godrej-nurture-panvel-mumbai-pdpid-4d4235303032303031", pricePerSqft: 9100, configs: "2,3 BHK", possession: "Dec 2026", distanceKm: 2.2 },
        { source: "magicbricks", name: "Tata Amantra", url: "https://www.magicbricks.com/tata-amantra-bhiwandi-mumbai-pdpid-4d4235303032303032", pricePerSqft: 7800, configs: "1,2 BHK", possession: "Ready", distanceKm: 4.8 },
      ],
    },
  },
  {
    id: "ulwe",
    city: "Mumbai",
    name: "Ulwe Node B Sector 17",
    area: "Ulwe, Mumbai",
    acres: 19.7,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 6800,
    areaRatePerSft: 9200,
    priceTrend: [
      { year: 2020, price: 4100 }, { year: 2021, price: 4900 },
      { year: 2022, price: 6200 }, { year: 2023, price: 7500 },
      { year: 2024, price: 8600 }, { year: 2025, price: 9200 },
    ],
    demographics: { schools: 11, hospitals: 5, malls: 2, metroKm: 3.4, highwayKm: 1.2 },
    corridors: ["NMIA runway proximity premium", "CIDCO Nodes 1-6 infra rollout", "Trans-Harbour connectivity"],
    flatMix: [
      { config: "2BHK", share: 40 }, { config: "3BHK", share: 48 },
      { config: "4BHK", share: 10 }, { config: "Penthouse", share: 2 },
    ],
    customerBase: [
      { segment: "Airport & Port Workforce", share: 38 }, { segment: "IT/BPO Professionals", share: 30 },
      { segment: "Investors", share: 22 }, { segment: "Others", share: 10 },
    ],
    limitations: ["CIDCO Sector Plan clearance required", "AAI NOC for airport approach funnel"],
    polygon: [
      [18.9728, 73.0242], [18.9725, 73.0272], [18.9695, 73.0276],
      [18.9691, 73.0248], [18.9710, 73.0236],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 602, url: "https://rezy.in/locality/602", locality: "Ulwe", avgPricePerSqft: 9200, yoyGrowthPct: 19.8, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Hiranandani Fortunia", url: "https://www.magicbricks.com/hiranandani-fortunia-oragadam-mumbai-pdpid-4d4235303032303033", pricePerSqft: 9800, configs: "2,3 BHK", possession: "Sep 2027", distanceKm: 3.1 },
      ],
    },
  },
  {
    id: "dombivali",
    city: "Mumbai",
    name: "Dombivali East Growth Hub",
    area: "Dombivali, Mumbai",
    acres: 12.3,
    status: "partial",
    category: "Residential Zone",
    pricePerSft: 7400,
    areaRatePerSft: 9800,
    priceTrend: [
      { year: 2020, price: 4600 }, { year: 2021, price: 5400 },
      { year: 2022, price: 6600 }, { year: 2023, price: 8100 },
      { year: 2024, price: 9100 }, { year: 2025, price: 9800 },
    ],
    demographics: { schools: 17, hospitals: 8, malls: 4, metroKm: 1.1, highwayKm: 0.7 },
    corridors: ["Central Railway fast local upgrade", "KDMC infra expansion", "Kalyan-Dombivali metro spur"],
    flatMix: [
      { config: "2BHK", share: 48 }, { config: "3BHK", share: 42 },
      { config: "4BHK", share: 8 }, { config: "Penthouse", share: 2 },
    ],
    customerBase: [
      { segment: "Commuter Families", share: 50 }, { segment: "Mid-segment IT", share: 26 },
      { segment: "First-time Buyers", share: 16 }, { segment: "Others", share: 8 },
    ],
    limitations: ["IOD stage — awaiting BMC plan sanction", "Old structure on north block — SRA clearance"],
    polygon: [
      [19.2148, 73.0952], [19.2146, 73.0978], [19.2122, 73.0981],
      [19.2120, 73.0955],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 603, url: "https://rezy.in/locality/603", locality: "Dombivali", avgPricePerSqft: 9800, yoyGrowthPct: 14.6, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Lodha Palava City", url: "https://www.magicbricks.com/lodha-palava-city-dombivali-mumbai-pdpid-4d4235303032303034", pricePerSqft: 10200, configs: "2,3 BHK", possession: "Ready", distanceKm: 2.8 },
        { source: "magicbricks", name: "Rustomjee Urbania", url: "https://www.magicbricks.com/rustomjee-urbania-thane-mumbai-pdpid-4d4235303032303035", pricePerSqft: 9400, configs: "3 BHK", possession: "Dec 2026", distanceKm: 4.2 },
      ],
    },
  },
  {
    id: "virar",
    city: "Mumbai",
    name: "Virar West Township",
    area: "Virar, Mumbai",
    acres: 21.8,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 3200,
    areaRatePerSft: 7200,
    priceTrend: [
      { year: 2020, price: 3200 }, { year: 2021, price: 3800 },
      { year: 2022, price: 4600 }, { year: 2023, price: 5800 },
      { year: 2024, price: 6600 }, { year: 2025, price: 7200 },
    ],
    demographics: { schools: 9, hospitals: 4, malls: 2, metroKm: 4.2, highwayKm: 1.8 },
    corridors: ["Western Railway Virar quadrupling", "Virar-Alibaug multimodal corridor", "NH 48 access"],
    flatMix: [
      { config: "2BHK", share: 55 }, { config: "3BHK", share: 36 },
      { config: "4BHK", share: 7 }, { config: "Penthouse", share: 2 },
    ],
    customerBase: [
      { segment: "Affordable Segment", share: 52 }, { segment: "Commuter Families", share: 28 },
      { segment: "Investors", share: 14 }, { segment: "Others", share: 6 },
    ],
    limitations: ["NA Order required from District Collector", "Approach road single-lane — BMC widening proposal"],
    polygon: [
      [19.4658, 72.8002], [19.4655, 72.8034], [19.4623, 72.8038],
      [19.4619, 72.8006], [19.4638, 72.7995],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 604, url: "https://rezy.in/locality/604", locality: "Virar West", avgPricePerSqft: 7200, yoyGrowthPct: 18.2, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Vasant Lawns", url: "https://www.magicbricks.com/vasant-lawns-thane-mumbai-pdpid-4d4235303032303036", pricePerSqft: 7500, configs: "2,3 BHK", possession: "Jun 2028", distanceKm: 3.6 },
      ],
    },
  },
  {
    id: "thane-ghodbunder",
    city: "Mumbai",
    name: "Thane Ghodbunder Road Block",
    area: "Thane West, Mumbai",
    acres: 8.9,
    status: "partial",
    category: "Mixed-Use",
    pricePerSft: 15500,
    areaRatePerSft: 14200,
    priceTrend: [
      { year: 2020, price: 7600 }, { year: 2021, price: 8600 },
      { year: 2022, price: 10200 }, { year: 2023, price: 12000 },
      { year: 2024, price: 13400 }, { year: 2025, price: 14200 },
    ],
    demographics: { schools: 22, hospitals: 12, malls: 7, metroKm: 1.8, highwayKm: 0.5 },
    corridors: ["Ghodbunder Road metro (Thane-Bhiwandi)", "Eastern Freeway extension", "TMC smart city infra"],
    flatMix: [
      { config: "2BHK", share: 25 }, { config: "3BHK", share: 52 },
      { config: "4BHK", share: 18 }, { config: "Penthouse", share: 5 },
    ],
    customerBase: [
      { segment: "Senior IT / CXO", share: 38 }, { segment: "NRI Investors", share: 30 },
      { segment: "Business Owners", share: 22 }, { segment: "Others", share: 10 },
    ],
    limitations: ["Change of use NOC (commercial → residential)", "High-rise committee review required (>70m)"],
    polygon: [
      [19.2148, 72.9782], [19.2146, 72.9808], [19.2122, 72.9811],
      [19.2120, 72.9785],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 605, url: "https://rezy.in/locality/605", locality: "Thane West", avgPricePerSqft: 14200, yoyGrowthPct: 11.8, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Hiranandani Estate", url: "https://www.magicbricks.com/hiranandani-estate-thane-mumbai-pdpid-4d4235303032303037", pricePerSqft: 15600, configs: "3,4 BHK", possession: "Ready", distanceKm: 2.4 },
        { source: "magicbricks", name: "Lodha Amara", url: "https://www.magicbricks.com/lodha-amara-thane-mumbai-pdpid-4d4235303032303038", pricePerSqft: 14200, configs: "2,3 BHK", possession: "Ready", distanceKm: 1.8 },
      ],
    },
  },
  {
    id: "badlapur",
    city: "Mumbai",
    name: "Badlapur East Township",
    area: "Badlapur, Mumbai",
    acres: 31.2,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 2100,
    areaRatePerSft: 5800,
    priceTrend: [
      { year: 2020, price: 2200 }, { year: 2021, price: 2700 },
      { year: 2022, price: 3500 }, { year: 2023, price: 4400 },
      { year: 2024, price: 5200 }, { year: 2025, price: 5800 },
    ],
    demographics: { schools: 7, hospitals: 3, malls: 1, metroKm: 18.6, highwayKm: 3.2 },
    corridors: ["Central Railway Badlapur fast local", "NH 61 (Pune road) proximity", "MSRDC Ring Road future"],
    flatMix: [
      { config: "2BHK", share: 58 }, { config: "3BHK", share: 34 },
      { config: "4BHK", share: 7 }, { config: "Penthouse", share: 1 },
    ],
    customerBase: [
      { segment: "Affordable Segment", share: 60 }, { segment: "First-time Buyers", share: 25 },
      { segment: "Investors", share: 12 }, { segment: "Others", share: 3 },
    ],
    limitations: ["NA Order required", "MPCB consent timeline — 4-6 months", "Low infrastructure density"],
    polygon: [
      [19.1558, 73.2568], [19.1555, 73.2604], [19.1515, 73.2609],
      [19.1510, 73.2573], [19.1534, 73.2560],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 606, url: "https://rezy.in/locality/606", locality: "Badlapur East", avgPricePerSqft: 5800, yoyGrowthPct: 24.1, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Sheth Vasant Oaks", url: "https://www.magicbricks.com/sheth-vasant-oaks-badlapur-mumbai-pdpid-4d4235303032303039", pricePerSqft: 6200, configs: "1,2 BHK", possession: "Dec 2027", distanceKm: 2.4 },
      ],
    },
  },
  {
    id: "kharghar",
    city: "Mumbai",
    name: "Kharghar Hills Sector",
    area: "Kharghar, Mumbai",
    acres: 15.6,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 9800,
    areaRatePerSft: 11400,
    priceTrend: [
      { year: 2020, price: 5600 }, { year: 2021, price: 6400 },
      { year: 2022, price: 7800 }, { year: 2023, price: 9400 },
      { year: 2024, price: 10600 }, { year: 2025, price: 11400 },
    ],
    demographics: { schools: 18, hospitals: 9, malls: 5, metroKm: 2.2, highwayKm: 0.8 },
    corridors: ["Navi Mumbai Metro Line 1 extension", "CBD Belapur business district", "NMIA access road"],
    flatMix: [
      { config: "2BHK", share: 30 }, { config: "3BHK", share: 52 },
      { config: "4BHK", share: 14 }, { config: "Penthouse", share: 4 },
    ],
    customerBase: [
      { segment: "IT/BFSI Professionals", share: 46 }, { segment: "NRI Investors", share: 24 },
      { segment: "Business Owners", share: 20 }, { segment: "Others", share: 10 },
    ],
    limitations: ["CIDCO plot allotment — premium FSI charges", "MHADA NOC for scheme integration"],
    polygon: [
      [19.0438, 73.0728], [19.0436, 73.0756], [19.0410, 73.0759],
      [19.0408, 73.0731], [19.0424, 73.0722],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 607, url: "https://rezy.in/locality/607", locality: "Kharghar", avgPricePerSqft: 11400, yoyGrowthPct: 16.4, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Paradise Sai Crystals", url: "https://www.magicbricks.com/paradise-sai-crystals-kharghar-mumbai-pdpid-4d4235303032303131", pricePerSqft: 11800, configs: "2,3 BHK", possession: "Jun 2027", distanceKm: 1.4 },
        { source: "magicbricks", name: "Godrej Horizon", url: "https://www.magicbricks.com/godrej-horizon-kharghar-mumbai-pdpid-4d4235303032303132", pricePerSqft: 12400, configs: "3,4 BHK", possession: "Dec 2027", distanceKm: 2.8 },
      ],
    },
  },
  {
    id: "kalyan",
    city: "Mumbai",
    name: "Kalyan Shilphata Corridor",
    area: "Kalyan, Mumbai",
    acres: 24.5,
    status: "undeveloped",
    category: "Residential Zone",
    pricePerSft: 4500,
    areaRatePerSft: 8100,
    priceTrend: [
      { year: 2020, price: 3800 }, { year: 2021, price: 4500 },
      { year: 2022, price: 5600 }, { year: 2023, price: 6800 },
      { year: 2024, price: 7500 }, { year: 2025, price: 8100 },
    ],
    demographics: { schools: 13, hospitals: 6, malls: 3, metroKm: 5.6, highwayKm: 1.4 },
    corridors: ["Kalyan-Dombivali metro extension", "Bhiwandi logistics hub access", "Samruddhi Expressway spur"],
    flatMix: [
      { config: "2BHK", share: 46 }, { config: "3BHK", share: 44 },
      { config: "4BHK", share: 8 }, { config: "Penthouse", share: 2 },
    ],
    customerBase: [
      { segment: "Mid-segment Families", share: 48 }, { segment: "Commuter Families", share: 28 },
      { segment: "Investors", share: 16 }, { segment: "Others", share: 8 },
    ],
    limitations: ["Debris clearance from quarrying activity", "NA Order timeline — 5-7 months"],
    polygon: [
      [19.2348, 73.1628], [19.2345, 73.1662], [19.2307, 73.1667],
      [19.2303, 73.1633], [19.2326, 73.1620],
    ],
    sources: {
      rezy: { source: "rezy.in", localityId: 608, url: "https://rezy.in/locality/608", locality: "Kalyan West", avgPricePerSqft: 8100, yoyGrowthPct: 17.8, fetchedAt: FETCHED },
      magicbricksComps: [
        { source: "magicbricks", name: "Lodha Palava Lakeshore Greens", url: "https://www.magicbricks.com/lodha-palava-lakeshore-kalyan-mumbai-pdpid-4d4235303032303133", pricePerSqft: 8600, configs: "2,3 BHK", possession: "Jun 2028", distanceKm: 3.2 },
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
