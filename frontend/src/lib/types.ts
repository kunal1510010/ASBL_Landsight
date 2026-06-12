export type ParcelStatus = "undeveloped" | "partial" | "developed";

export interface RezyLocalitySnapshot {
  source: "rezy.in";
  localityId: number;
  url: string;
  locality: string;
  avgPricePerSqft: number;
  yoyGrowthPct: number;
  fetchedAt: string;
}

export interface MagicBricksComp {
  source: "magicbricks";
  name: string;
  url: string;
  pricePerSqft: number;
  configs: string;
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
  category: string;
  pricePerSft: number;       // land asking, Rs/sft of land
  areaRatePerSft: number;    // apartment benchmark, Rs/sft
  priceTrend: { year: number; price: number }[];
  demographics: { schools: number; hospitals: number; malls: number; metroKm: number; highwayKm: number };
  corridors: string[];
  flatMix: { config: string; share: number }[];
  customerBase: { segment: string; share: number }[];
  limitations: string[];
  blocked?: boolean;
  blockedReason?: string;
  financeApproved: boolean;
  financeNote: string;
  landOutlayCr: number;
  polygon: [number, number][];
  sources: { rezy: RezyLocalitySnapshot; magicbricksComps: MagicBricksComp[] };
}

export interface ScrapedProject {
  name: string;
  url: string;
  pricePerSqft: number;
  configs: string;
  priceLabel: string;
  distanceKm: number;
}

export interface LocalityMarket {
  societies: ScrapedProject[];
  avgRate: number;
  rateRange: { min: number; max: number };
  yoyGrowthPct: number | null;
  insights: string[];
  locality: string;
  fetchedAt: string;
  source: "99acres";
}

export interface MonthCash { label: string; inflowCr: number; outflowCr: number }

export interface FinanceSummary {
  source: "neon" | "bundled";
  generatedFrom: string;
  horizon: { from: string; to: string; months: number };
  calibration: {
    constructionCostPerSqft: number;
    benchmarkPricePerSqft: number;
    benchmarkMarginPct: number;
    avgUnitSqft: number;
    source: string;
  };
  policy: { creditLineCr: number; minBufferCr: number };
  projects: {
    name: string; inflowCr: number; outflowCr: number; soldUnits: number;
    totalFlats: number; avgPricePerSqft: number; avgCostPerSqft: number; unsoldFlats: number;
  }[];
  companyMonthly: MonthCash[];
}
