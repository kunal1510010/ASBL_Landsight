/**
 * Shared underwriting engine.
 * Finance data comes from a snapshot of ASBL's finance-module
 * projects-cashflow API (Jun 2026) — see data/finance-data.ts.
 */
export const ACRE_TO_SFT = 43560;

export interface MonthCash { label: string; inflowCr: number; outflowCr: number }
export interface FinancePolicy { creditLineCr: number; minBufferCr: number }

export interface AcquisitionAssessment {
  approved: boolean;
  outlayCr: number;
  worstCr: number;
  worstMonth: string;
  headroomCr: number;
  limitCr: number;
  note: string;
  series: { label: string; baseline: number; withAcquisition: number }[];
}

export function estimateLandOutlayCr(acres: number, landRatePerSft: number): number {
  return (acres * ACRE_TO_SFT * landRatePerSft) / 1e7;
}

export function assessLandAcquisition(
  outlayCr: number,
  companyMonthly: readonly MonthCash[],
  policy: FinancePolicy,
  opts: { startMonth?: number; spreadMonths?: number } = {},
): AcquisitionAssessment {
  const { startMonth = 2, spreadMonths = 12 } = opts;
  const limitCr = -(policy.creditLineCr - policy.minBufferCr);

  let base = 0;
  let withAcq = 0;
  let worstCr = Infinity;
  let worstMonth = "";
  const perMonth = outlayCr / spreadMonths;

  const series = companyMonthly.map((m, i) => {
    const net = m.inflowCr - m.outflowCr;
    base += net;
    withAcq += net - (i >= startMonth && i < startMonth + spreadMonths ? perMonth : 0);
    if (withAcq < worstCr) {
      worstCr = withAcq;
      worstMonth = m.label;
    }
    return {
      label: m.label,
      baseline: Math.round(base * 10) / 10,
      withAcquisition: Math.round(withAcq * 10) / 10,
    };
  });

  const approved = worstCr >= limitCr;
  const headroomCr = Math.round((worstCr - limitCr) * 10) / 10;
  worstCr = Math.round(worstCr * 10) / 10;

  const note = approved
    ? `Within portfolio headroom. Cash trough Rs ${worstCr} Cr in ${worstMonth} - covered by the Rs ${policy.creditLineCr} Cr credit line with Rs ${headroomCr} Cr to spare.`
    : `Breaches funding capacity. Cash would dip to Rs ${worstCr} Cr in ${worstMonth}, Rs ${Math.abs(headroomCr)} Cr beyond the Rs ${policy.creditLineCr} Cr credit line.`;

  return { approved, outlayCr: Math.round(outlayCr), worstCr, worstMonth, headroomCr, limitCr, note, series };
}
