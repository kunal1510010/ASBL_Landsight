/** Client-side mirror of the backend engine for live slider recompute. */
import type { MonthCash, FinanceSummary } from "./types";

export const ACRE_TO_SFT = 43560;

export interface Assessment {
  approved: boolean;
  worstCr: number;
  worstMonth: string;
  headroomCr: number;
  limitCr: number;
  series: { label: string; baseline: number; withAcquisition: number }[];
}

export function assessAcquisition(
  outlayCr: number,
  companyMonthly: MonthCash[],
  policy: FinanceSummary["policy"],
  startMonth = 2,
  spreadMonths = 12,
): Assessment {
  const limitCr = -(policy.creditLineCr - policy.minBufferCr);
  let base = 0, withAcq = 0, worstCr = Infinity, worstMonth = "";
  const perMonth = outlayCr / spreadMonths;
  const series = companyMonthly.map((m, i) => {
    const net = m.inflowCr - m.outflowCr;
    base += net;
    withAcq += net - (i >= startMonth && i < startMonth + spreadMonths ? perMonth : 0);
    if (withAcq < worstCr) { worstCr = withAcq; worstMonth = m.label; }
    return { label: m.label, baseline: Math.round(base * 10) / 10, withAcquisition: Math.round(withAcq * 10) / 10 };
  });
  return {
    approved: worstCr >= limitCr,
    worstCr: Math.round(worstCr * 10) / 10,
    worstMonth,
    headroomCr: Math.round((worstCr - limitCr) * 10) / 10,
    limitCr,
    series,
  };
}

export interface SimInput {
  towers: number; floors: number; unitsPerFloor: number; avgSft: number;
  pricePerSft: number; growthPct: number; years: number;
  landOutlayCr: number; constructionCostPerSqft: number;
}

export interface SimResult {
  totalUnits: number; sellableSft: number;
  landCost: number; constructionCost: number; approvalsCost: number; totalCost: number;
  totalRevenue: number; profit: number; marginPct: number;
  rows: { year: string; revenue: number; cost: number; cumulative: number; price: number }[];
  peakNeedCr: number;
}

export function simulate(i: SimInput): SimResult {
  const totalUnits = i.towers * i.floors * i.unitsPerFloor;
  const sellableSft = totalUnits * i.avgSft;
  const landCost = i.landOutlayCr * 1e7;
  const constructionCost = sellableSft * i.constructionCostPerSqft;
  const approvalsCost = (landCost + constructionCost) * 0.08;
  const totalCost = landCost + constructionCost + approvalsCost;

  // Land is paid in year 1; construction+approvals spread evenly across the duration.
  const rows: SimResult["rows"] = [];
  let cumulative = 0;
  const sftPerYear = sellableSft / i.years;
  const buildPerYear = (constructionCost + approvalsCost) / i.years;
  for (let y = 1; y <= i.years; y++) {
    const price = i.pricePerSft * Math.pow(1 + i.growthPct / 100, y - 1);
    const revenue = sftPerYear * price;
    const cost = buildPerYear + (y === 1 ? landCost : 0);
    cumulative += revenue - cost;
    rows.push({ year: `Y${y}`, revenue: Math.round(revenue), cost: Math.round(cost), cumulative: Math.round(cumulative), price: Math.round(price) });
  }
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const profit = totalRevenue - totalCost;
  return {
    totalUnits, sellableSft, landCost, constructionCost, approvalsCost, totalCost,
    totalRevenue, profit,
    marginPct: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
    rows,
    peakNeedCr: Math.round(Math.abs(Math.min(0, ...rows.map((r) => r.cumulative))) / 1e7),
  };
}

export const inrCr = (n: number) => `Rs ${(n / 1e7).toFixed(1)} Cr`;

/** Returns the 0-based index into companyMonthly with maximum cashflow headroom. */
export function findBestStartMonth(
  outlayCr: number,
  companyMonthly: MonthCash[],
  policy: FinanceSummary["policy"],
  spreadMonths = 12,
): number {
  const maxStart = Math.max(0, companyMonthly.length - spreadMonths);
  let bestIdx = 0;
  let bestHeadroom = -Infinity;
  for (let i = 0; i <= maxStart; i++) {
    const r = assessAcquisition(outlayCr, companyMonthly, policy, i, spreadMonths);
    if (r.headroomCr > bestHeadroom) {
      bestHeadroom = r.headroomCr;
      bestIdx = i;
    }
  }
  return bestIdx;
}
