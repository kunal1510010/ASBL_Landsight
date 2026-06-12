import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { fetchParcels, fetchFinance } from "@/lib/api";
import { assessAcquisition } from "@/lib/engine";
import type { Parcel, FinanceSummary } from "@/lib/types";
import { Card, CardContent, Button, Badge, Section, cn } from "@/components/ui";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import {
  TrendingUp, School, Hospital, ShoppingBag, TrainFront, Route as RouteIcon,
  Building2, Users, Tag, ShieldAlert, Wallet, Calculator, ArrowRight,
} from "lucide-react";

const CHART = ["#2f7a5d", "#d99a2b", "#c75b39", "#4169a8", "#8d5fb0"];
const tooltipStyle = { backgroundColor: "white", border: "1px solid #ddd", borderRadius: 8, fontSize: 12 };

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);

  const [all, setAll] = useState<Parcel[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    // Load all saved custom parcels from localStorage (so they appear in comparison dropdown too)
    const customParcels: Parcel[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("landsight.parcel.custom-")) continue;
      const raw = localStorage.getItem(key);
      if (raw) try { customParcels.push(JSON.parse(raw) as Parcel); } catch {}
    }

    fetchParcels()
      .then(({ parcels }) => setAll([...parcels, ...customParcels]))
      .catch(() => setAll(customParcels));
    fetchFinance().then(setFinance).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parcels = ids.map((id) => all.find((p) => p.id === id)).filter(Boolean) as Parcel[];
  const fallback = all.filter((p) => !p.blocked)[0];
  const effective = parcels.length > 0 ? parcels : fallback ? [fallback] : [];

  if (all.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (effective.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-6 py-12 text-center space-y-3">
          <h1 className="text-xl font-semibold">No parcel selected</h1>
          <Button onClick={() => navigate("/discover")}>Go to discover</Button>
        </div>
      </AppShell>
    );
  }

  const compare = effective.length > 1;
  const primary = effective[0];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{compare ? "Comparison" : "Land analysis"}</div>
            <h1 className="text-2xl font-semibold">{effective.map((p) => p.name).join("  vs  ")}</h1>
            <p className="text-sm text-muted-foreground">
              {compare ? "Side-by-side on all 9 feasibility points." : "9-point feasibility dashboard."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!compare && (
              <select
                className="rounded-md border bg-card px-3 py-2 text-sm"
                value=""
                onChange={(e) => e.target.value && navigate(`/analyze?ids=${primary.id},${e.target.value}`)}
              >
                <option value="">+ Compare with...</option>
                {all.filter((p) => p.id !== primary.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {compare && (
              <Button variant="outline" onClick={() => navigate(`/analyze?ids=${primary.id}`)}>Exit compare</Button>
            )}
            <Button onClick={() => navigate(`/simulate?id=${primary.id}`)}>
              <Calculator className="h-4 w-4" /> Simulate <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <div className={cn("grid gap-3", compare && "md:grid-cols-2")}>
          {effective.map((p) => (
            <Card key={p.id}>
              <CardContent className="!py-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.area} · {p.acres} ac · {p.category}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">Rs {p.landOutlayCr.toLocaleString("en-IN")} Cr</div>
                    <div className="text-xs text-muted-foreground">total land value</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-right">
                    <div className="text-lg font-semibold">Rs {p.areaRatePerSft.toLocaleString("en-IN")}</div>
                    <div className="text-xs text-muted-foreground">apt. per sft</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 1. Price discovery */}
        <Section icon={<TrendingUp className="h-4 w-4" />} title="1. Price discovery" subtitle="Apartment Rs/sft trend - rezy.in locality data + MagicBricks comps">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={mergeTrend(effective)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="year" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `Rs ${v.toLocaleString("en-IN")}/sft`} />
                <Legend />
                {effective.map((p, i) => (
                  <Line key={p.id} type="monotone" dataKey={p.id} name={p.name} stroke={CHART[i % CHART.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={cn("grid gap-3 mt-3", compare ? "md:grid-cols-2" : "md:grid-cols-3")}>
            {effective.map((p) => {
              const first = p.priceTrend[0].price;
              const last = p.priceTrend[p.priceTrend.length - 1].price;
              const cagr = (Math.pow(last / first, 1 / (p.priceTrend.length - 1)) - 1) * 100;
              return (
                <div key={p.id} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{p.name}</div>
                  <div className="text-lg font-semibold">Rs {last.toLocaleString("en-IN")}/sft</div>
                  <div className="text-xs" style={{ color: "#2f7a5d" }}>CAGR {cagr.toFixed(1)}% - rezy.in YoY {p.sources.rezy.yoyGrowthPct}%</div>
                </div>
              );
            })}
          </div>
          {/* Comps table */}
          <div className={cn("grid gap-3 mt-3", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-2">{compare && `${p.name} - `}Nearby project comps (MagicBricks)</div>
                {p.sources.magicbricksComps.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active comps in this micro-market.</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left font-medium py-1.5">Project</th>
                        <th className="text-right font-medium">Rs/sft</th>
                        <th className="text-right font-medium">Configs</th>
                        <th className="text-right font-medium">Possession</th>
                        <th className="text-right font-medium">Dist.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.sources.magicbricksComps.map((c) => (
                        <tr key={c.url} className="border-b last:border-0">
                          <td className="py-1.5">
                            <a href={c.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.name}</a>
                          </td>
                          <td className="text-right tabular-nums">{c.pricePerSqft.toLocaleString("en-IN")}</td>
                          <td className="text-right">{c.configs}</td>
                          <td className="text-right">{c.possession}</td>
                          <td className="text-right">{c.distanceKm} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* 2. Demographics */}
        <Section icon={<School className="h-4 w-4" />} title="2. Local demographics & social infra" subtitle="Schools, hospitals, malls and connectivity">
          <div className={cn("grid gap-4", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 space-y-3">
                {compare && <div className="text-sm font-medium">{p.name}</div>}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <Demo icon={<School className="h-4 w-4" />} label="Schools" value={p.demographics.schools} />
                  <Demo icon={<Hospital className="h-4 w-4" />} label="Hospitals" value={p.demographics.hospitals} />
                  <Demo icon={<ShoppingBag className="h-4 w-4" />} label="Malls" value={p.demographics.malls} />
                  <Demo icon={<TrainFront className="h-4 w-4" />} label="Metro" value={`${p.demographics.metroKm} km`} />
                  <Demo icon={<RouteIcon className="h-4 w-4" />} label="Highway" value={`${p.demographics.highwayKm} km`} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 3. Corridors */}
        <Section icon={<Building2 className="h-4 w-4" />} title="3. Upcoming corridors, SEZs & infra" subtitle="Announced projects driving future demand">
          <div className={cn("grid gap-3", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <div key={p.id} className="rounded-lg border p-4">
                {compare && <div className="text-sm font-medium mb-2">{p.name}</div>}
                <ul className="space-y-1.5">
                  {p.corridors.map((c) => (
                    <li key={c} className="text-sm flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#d99a2b" }} /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. Flat config */}
        <Section icon={<Building2 className="h-4 w-4" />} title="4. Flat configurations that sell" subtitle="Share of recent absorption by unit type">
          <div className={cn("grid gap-4", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <div key={p.id} className="rounded-lg border p-4">
                {compare && <div className="text-sm font-medium mb-2">{p.name}</div>}
                <div className="h-56">
                  <ResponsiveContainer>
                    <BarChart data={p.flatMix} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                      <XAxis type="number" fontSize={12} tickFormatter={(v: number) => `${v}%`} />
                      <YAxis dataKey="config" type="category" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="share" fill={CHART[0]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 5. Customer base */}
        <Section icon={<Users className="h-4 w-4" />} title="5. Major customer base" subtitle="Who buys in this micro-market">
          <div className={cn("grid gap-4", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <div key={p.id} className="rounded-lg border p-4">
                {compare && <div className="text-sm font-medium mb-2">{p.name}</div>}
                <div className="h-56">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={p.customerBase} dataKey="share" nameKey="segment" outerRadius={80} innerRadius={40}>
                        {p.customerBase.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Land category */}
        <Section icon={<Tag className="h-4 w-4" />} title="6. Land category" subtitle="Zoning classification & conversion need">
          <div className={cn("grid gap-3", compare && "md:grid-cols-2")}>
            {effective.map((p) => {
              const needsConv = p.category === "Agricultural";
              return (
                <div key={p.id} className="rounded-lg border p-4 flex items-start justify-between gap-3">
                  <div>
                    {compare && <div className="text-xs text-muted-foreground">{p.name}</div>}
                    <div className="text-lg font-semibold">{p.category}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {needsConv ? "Land-use conversion required before development." : "Ready for development under current zoning."}
                    </div>
                  </div>
                  <Badge tone={needsConv ? "warning" : "success"}>{needsConv ? "Conversion" : "Ready"}</Badge>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 7. Limitations */}
        <Section icon={<ShieldAlert className="h-4 w-4" />} title="7. Geographic / industrial limitations" subtitle="Constraints that may block or slow construction">
          <div className={cn("grid gap-3", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <div key={p.id} className={cn("rounded-lg border p-4", p.blocked && "border-destructive/60 bg-destructive/5")}>
                {compare && <div className="text-sm font-medium mb-2">{p.name}</div>}
                {p.limitations.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No material limitations identified.</div>
                ) : (
                  <ul className="space-y-1.5">
                    {p.limitations.map((l) => (
                      <li key={l} className="text-sm flex items-start gap-2">
                        <ShieldAlert className={cn("h-4 w-4 shrink-0 mt-0.5", p.blocked ? "text-destructive" : "text-warning")} /> {l}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* 8. Profitability link */}
        <Section icon={<Calculator className="h-4 w-4" />} title="8. Project profitability" subtitle="Configure towers, floors, units & SFT to see cashflow">
          <div className={cn("grid gap-3", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 flex items-center justify-between gap-3">
                <div>
                  {compare && <div className="text-xs text-muted-foreground">{p.name}</div>}
                  <div className="text-sm">Open the simulator - cost model calibrated from ASBL's Legacy project.</div>
                </div>
                <Button disabled={p.blocked} onClick={() => navigate(`/simulate?id=${p.id}`)}>
                  <Calculator className="h-4 w-4" /> Simulate
                </Button>
              </div>
            ))}
          </div>
        </Section>

        {/* 9. Finance - real portfolio cashflow */}
        <Section
          icon={<Wallet className="h-4 w-4" />}
          title="9. Company finance approval"
          subtitle={finance ? `Computed against ${finance.generatedFrom}` : "Computed against portfolio cashflow"}
        >
          <div className={cn("grid gap-3", compare && "md:grid-cols-2")}>
            {effective.map((p) => (
              <FinanceCard key={p.id} parcel={p} finance={finance} showName={compare} />
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function FinanceCard({ parcel, finance, showName }: { parcel: Parcel; finance: FinanceSummary | null; showName: boolean }) {
  const assessment = useMemo(() => {
    if (!finance || parcel.blocked) return null;
    return assessAcquisition(parcel.landOutlayCr, finance.companyMonthly, finance.policy);
  }, [finance, parcel]);

  const quarterly = useMemo(
    () => (assessment ? assessment.series.filter((_, i) => i % 3 === 0) : []),
    [assessment],
  );

  return (
    <div className={cn("rounded-lg border p-4 space-y-3", parcel.financeApproved ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5")}>
      {showName && <div className="text-xs text-muted-foreground">{parcel.name}</div>}
      <div className="flex items-center gap-2">
        <Wallet className={cn("h-5 w-5", parcel.financeApproved ? "text-success" : "text-destructive")} />
        <span className="font-semibold">{parcel.financeApproved ? "Approved" : "Not approved"}</span>
        <span className="text-xs text-muted-foreground ml-auto">Land outlay Rs {parcel.landOutlayCr.toLocaleString("en-IN")} Cr</span>
      </div>
      <div className="text-xs text-muted-foreground">{parcel.financeNote}</div>
      {assessment && (
        <div className="h-44">
          <ResponsiveContainer>
            <LineChart data={quarterly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
              <XAxis dataKey="label" fontSize={10} interval={2} />
              <YAxis fontSize={10} tickFormatter={(v: number) => `${v}`} width={44} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `Rs ${v.toLocaleString("en-IN")} Cr`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={assessment.limitCr} stroke="#c75b39" strokeDasharray="4 4" label={{ value: "credit limit", fontSize: 10, fill: "#c75b39" }} />
              <Line type="monotone" dataKey="baseline" name="Portfolio (planned)" stroke="#9aa3a0" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="withAcquisition" name="With this acquisition" stroke={parcel.financeApproved ? "#2f7a5d" : "#c75b39"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function mergeTrend(parcels: Parcel[]) {
  const years = parcels[0].priceTrend.map((t) => t.year);
  return years.map((year) => {
    const row: Record<string, number> = { year };
    parcels.forEach((p) => {
      const point = p.priceTrend.find((t) => t.year === year);
      if (point) row[p.id] = point.price;
    });
    return row;
  });
}

function Demo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-center">
      <div className="mx-auto w-fit text-muted-foreground">{icon}</div>
      <div className="text-sm font-semibold mt-1">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
