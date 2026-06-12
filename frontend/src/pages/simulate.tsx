import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { fetchParcels, fetchFinance } from "@/lib/api";
import { simulate, assessAcquisition, findBestStartMonth, inrCr } from "@/lib/engine";
import type { Parcel, FinanceSummary } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, Button, cn } from "@/components/ui";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { Calculator, Wallet, CalendarClock, Star } from "lucide-react";

const tooltipStyle = { backgroundColor: "white", border: "1px solid #ddd", borderRadius: 8, fontSize: 12 };

export default function SimulatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wanted = params.get("id");

  const [all, setAll] = useState<Parcel[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [parcelId, setParcelId] = useState<string | null>(null);

  useEffect(() => {
    fetchParcels().then(({ parcels }) => {
      setAll(parcels);
      const usable = parcels.filter((p) => !p.blocked);
      const pick = usable.find((p) => p.id === wanted) ?? usable[0];
      setParcelId(pick?.id ?? null);
    }).catch(() => {});
    fetchFinance().then(setFinance).catch(() => {});
  }, [wanted]);

  const parcel = all.find((p) => p.id === parcelId) ?? null;

  const [towers, setTowers] = useState(4);
  const [floors, setFloors] = useState(20);
  const [unitsPerFloor, setUnitsPerFloor] = useState(6);
  const [avgSft, setAvgSft] = useState(0);
  const [pricePerSft, setPricePerSft] = useState(0);
  const [growthPct, setGrowthPct] = useState(8);
  const [years, setYears] = useState(5);

  // Purchase timing
  const [startMonthIdx, setStartMonthIdx] = useState<number | null>(null); // null = use best
  const [landGrowthPct, setLandGrowthPct] = useState(8);

  // initialize from real calibration + parcel benchmark once loaded
  useEffect(() => {
    if (finance && avgSft === 0) setAvgSft(finance.calibration.avgUnitSqft);
  }, [finance, avgSft]);
  useEffect(() => {
    if (parcel) setPricePerSft(parcel.areaRatePerSft);
  }, [parcel]);

  const costPerSft = finance?.calibration.constructionCostPerSqft ?? 7740;

  // Best month: max headroom across all possible start months
  const bestMonthIdx = useMemo(() => {
    if (!finance || !parcel) return 0;
    return findBestStartMonth(parcel.landOutlayCr, finance.companyMonthly, finance.policy);
  }, [finance, parcel]);

  // Use chosen month or fall back to best
  const activeMonthIdx = startMonthIdx ?? bestMonthIdx;

  // Land cost escalates with time: rate × (1 + landGrowthPct/100)^(months/12)
  const adjustedLandOutlayCr = useMemo(() => {
    if (!parcel) return 0;
    const multiplier = Math.pow(1 + landGrowthPct / 100, activeMonthIdx / 12);
    return parseFloat((parcel.landOutlayCr * multiplier).toFixed(2));
  }, [parcel, activeMonthIdx, landGrowthPct]);


  const sim = useMemo(() => {
    if (!parcel || avgSft === 0 || pricePerSft === 0) return null;
    return simulate({
      towers, floors, unitsPerFloor, avgSft, pricePerSft, growthPct, years,
      landOutlayCr: adjustedLandOutlayCr,
      constructionCostPerSqft: costPerSft,
    });
  }, [parcel, towers, floors, unitsPerFloor, avgSft, pricePerSft, growthPct, years, costPerSft, adjustedLandOutlayCr]);

  const financeCheck = useMemo(() => {
    if (!finance || !parcel) return null;
    return assessAcquisition(adjustedLandOutlayCr, finance.companyMonthly, finance.policy, activeMonthIdx);
  }, [finance, parcel, adjustedLandOutlayCr, activeMonthIdx]);

  if (!parcel || !sim) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-6 py-12"><div className="h-40 rounded-xl bg-muted animate-pulse" /></div>
      </AppShell>
    );
  }

  const quarterly = financeCheck ? financeCheck.series.filter((_, i) => i % 3 === 0) : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Simulation</div>
            <h1 className="text-2xl font-semibold">Project cashflow & profitability</h1>
            <p className="text-sm text-muted-foreground">
              Construction cost Rs {costPerSft.toLocaleString("en-IN")}/sft - calibrated from {finance?.calibration.source ?? "portfolio"}.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              className="rounded-md border bg-card px-3 py-2 text-sm w-[240px]"
              value={parcel.id}
              onChange={(e) => setParcelId(e.target.value)}
            >
              {all.filter((p) => !p.blocked).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button variant="outline" onClick={() => navigate(`/analyze?ids=${parcel.id}`)}>Back to analysis</Button>
          </div>
        </div>

        {/* Inputs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Project inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-5 items-center">
              <NumberField label="Towers" value={towers} onChange={setTowers} min={1} max={20} />
              <NumberField label="Floors / tower" value={floors} onChange={setFloors} min={1} max={60} />
              <NumberField label="Units / floor" value={unitsPerFloor} onChange={setUnitsPerFloor} min={1} max={20} />
              <NumberField label="Avg unit SFT" value={avgSft} onChange={setAvgSft} min={400} max={6000} step={50} />
              <NumberField label="Price Rs/sft" value={pricePerSft} onChange={setPricePerSft} min={3000} max={20000} step={100} hint={`Bench Rs ${parcel.areaRatePerSft.toLocaleString("en-IN")}`} />
              <NumberField label={`Growth p.a. (${growthPct}%)`} value={growthPct} onChange={setGrowthPct} min={0} max={20} hideInput />
              <NumberField label={`Duration (${years}y)`} value={years} onChange={setYears} min={2} max={8} hideInput />
            </div>
          </CardContent>
        </Card>

        {/* Purchase timing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Purchase timing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Month selector */}
              <div className="space-y-2">
                <div className="text-sm font-medium">When to buy land</div>
                <select
                  className="w-full rounded-md border bg-card px-3 py-2 text-sm"
                  value={activeMonthIdx}
                  onChange={(e) => setStartMonthIdx(Number(e.target.value))}
                >
                  {finance?.companyMonthly.map((m, i) => (
                    i <= (finance.companyMonthly.length - 12) && (
                      <option key={i} value={i}>
                        {m.label}{i === bestMonthIdx ? "  ★ Recommended" : ""}
                      </option>
                    )
                  ))}
                </select>
                {startMonthIdx !== null && startMonthIdx !== bestMonthIdx && (
                  <button
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={() => setStartMonthIdx(null)}
                  >
                    <Star className="h-3 w-3" /> Jump to recommended ({finance?.companyMonthly[bestMonthIdx]?.label})
                  </button>
                )}
                {(startMonthIdx === null || startMonthIdx === bestMonthIdx) && (
                  <div className="text-xs text-success flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Optimal month — highest portfolio headroom
                  </div>
                )}
              </div>

              {/* Land cost at selected month */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Land cost impact</div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Today (Jun 2026)</span>
                    <span>Rs {parcel.landOutlayCr.toLocaleString("en-IN")} Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">At {finance?.companyMonthly[activeMonthIdx]?.label}</span>
                    <span className={cn("font-semibold", adjustedLandOutlayCr > parcel.landOutlayCr ? "text-destructive" : "text-success")}>
                      Rs {adjustedLandOutlayCr.toLocaleString("en-IN")} Cr
                    </span>
                  </div>
                  {activeMonthIdx > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Premium over today</span>
                      <span>+{(((adjustedLandOutlayCr / parcel.landOutlayCr) - 1) * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className="pt-1">
                  <NumberField
                    label={`Land appreciation (${landGrowthPct}% p.a.)`}
                    value={landGrowthPct} onChange={setLandGrowthPct}
                    min={0} max={25} hideInput
                  />
                </div>
              </div>

              {/* Headroom at selected month */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Portfolio headroom</div>
                {financeCheck && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Headroom</span>
                      <span className={cn("font-semibold", financeCheck.approved ? "text-success" : "text-destructive")}>
                        Rs {financeCheck.headroomCr} Cr
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Cash trough</span>
                      <span>Rs {financeCheck.worstCr} Cr in {financeCheck.worstMonth}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Credit limit</span>
                      <span>−Rs {Math.abs(financeCheck.limitCr)} Cr</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardContent className="!py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Metric value={inrCr(sim.profit)} label="Projected profit" />
              <Metric value={`${sim.marginPct.toFixed(1)}%`} label={`Margin (bench ${finance?.calibration.benchmarkMarginPct ?? 28.3}%)`} />
              <Metric value={`Rs ${sim.peakNeedCr} Cr`} label="Peak funding need" />
              <Metric value={sim.totalUnits.toLocaleString("en-IN")} label="Total units" />
              <Metric value={`${(sim.sellableSft / 1000).toFixed(0)}k sft`} label="Sellable area" />
              <Metric value={`Rs ${adjustedLandOutlayCr.toLocaleString("en-IN")} Cr`} label={`Land outlay at ${finance?.companyMonthly[activeMonthIdx]?.label ?? "Y1"}`} />
            </div>
          </CardContent>
        </Card>

        {/* Year-wise cashflow + assumptions */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle>Year-wise cashflow (Rs Cr)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={sim.rows.map((r) => ({ ...r, revenue: r.revenue / 1e7, cost: r.cost / 1e7 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                    <XAxis dataKey="year" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `Rs ${v.toFixed(1)} Cr`} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#2f7a5d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Cost" fill="#c75b39" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Land paid in Y1; construction & approvals spread across the duration.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle>Cost & price assumptions</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label={`Land (${parcel.acres} ac @ Rs ${parcel.pricePerSft.toLocaleString("en-IN")}/sft)`} value={inrCr(sim.landCost)} />
              <Row label={`Construction @ Rs ${costPerSft.toLocaleString("en-IN")}/sft (Legacy actual)`} value={inrCr(sim.constructionCost)} />
              <Row label="Approvals & overheads (8%)" value={inrCr(sim.approvalsCost)} />
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total project cost</span><span>{inrCr(sim.totalCost)}</span>
              </div>
              <div className="flex justify-between font-semibold" style={{ color: "#2f7a5d" }}>
                <span>Projected profit</span><span>{inrCr(sim.profit)}</span>
              </div>
              <div className="text-xs text-muted-foreground pt-2">
                Y1 price Rs {pricePerSft.toLocaleString("en-IN")}/sft growing {growthPct}% p.a. over {years} years.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cumulative project profit */}
        <Card>
          <CardHeader className="pb-3"><CardTitle>Cumulative project cashflow (Rs Cr)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={sim.rows.map((r) => ({ ...r, cumulative: r.cumulative / 1e7 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `Rs ${v.toFixed(1)} Cr`} />
                  <ReferenceLine y={0} stroke="#9aa3a0" />
                  <Line type="monotone" dataKey="cumulative" stroke="#2f7a5d" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Company finance impact - the real check */}
        <Card className={cn(financeCheck?.approved ? "border-success/60" : "border-destructive/60")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Wallet className={cn("h-4 w-4", financeCheck?.approved ? "text-success" : "text-destructive")} />
              Company finance impact - {financeCheck?.approved ? "within capacity" : "exceeds capacity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {financeCheck ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Land outlay of Rs {parcel.landOutlayCr.toLocaleString("en-IN")} Cr injected into ASBL's planned portfolio cashflow
                  (8 active projects, Jun 2026 snapshot). Trough: <b>Rs {financeCheck.worstCr} Cr</b> in {financeCheck.worstMonth};
                  limit Rs {financeCheck.limitCr} Cr.
                </p>
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={quarterly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                      <XAxis dataKey="label" fontSize={11} interval={1} />
                      <YAxis fontSize={11} tickFormatter={(v: number) => `${v}`} width={48} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `Rs ${v.toLocaleString("en-IN")} Cr`} />
                      <Legend />
                      <ReferenceLine y={financeCheck.limitCr} stroke="#c75b39" strokeDasharray="4 4" label={{ value: "credit limit", fontSize: 11, fill: "#c75b39" }} />
                      <Line type="monotone" dataKey="baseline" name="Portfolio (planned)" stroke="#9aa3a0" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      <Line type="monotone" dataKey="withAcquisition" name="With this acquisition" stroke={financeCheck.approved ? "#2f7a5d" : "#c75b39"} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="h-24 rounded bg-muted animate-pulse" />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function NumberField({
  label, value, onChange, min, max, step = 1, hint, hideInput,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; hint?: string; hideInput?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {!hideInput && (
          <input
            type="number"
            className="w-20 rounded border bg-card px-2 py-1 text-right text-sm"
            value={value}
            min={min} max={max} step={step}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        )}
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border px-3 py-2.5 bg-card">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
