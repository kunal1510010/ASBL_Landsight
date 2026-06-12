import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import ParcelMap from "@/components/parcel-map";
import { fetchParcels, enrichLocality } from "@/lib/api";
import { estimateAcres } from "@/lib/geo";
import { generateParcelFromPolygon } from "@/lib/parcel-gen";
import type { Parcel, LocalityMarket } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Stat, Input, cn } from "@/components/ui";
import {
  Sparkles, ArrowRight, MapPin, Layers, ScanSearch, ShieldAlert, ExternalLink,
  Pencil, X, CheckCircle2, Loader2, TrendingUp, Building2, RefreshCw,
} from "lucide-react";

function statusBadge(p: Parcel) {
  if (p.blocked) return <Badge tone="destructive">Blocked</Badge>;
  if (p.status === "undeveloped") return <Badge tone="success">Undeveloped</Badge>;
  if (p.status === "partial") return <Badge tone="warning">Partial</Badge>;
  return <Badge>Developed</Badge>;
}

type ScanState = "idle" | "scanning" | "done";

const ANALYSIS_STEPS = [
  "Estimating land area from polygon...",
  "Searching nearby projects in the area...",
  "Fetching MagicBricks comparables...",
  "Getting Rezy locality price data...",
  "Building analysis report...",
];

type CityFilter = "all" | "Hyderabad" | "Bangalore" | "Mumbai";

const CITY_MAP_CONFIG: Record<CityFilter, { center: [number, number]; zoom: number }> = {
  all:        { center: [17.385, 78.486], zoom: 11 },
  Hyderabad:  { center: [17.385, 78.486], zoom: 11 },
  Bangalore:  { center: [12.972, 77.594], zoom: 11 },
  Mumbai:     { center: [19.076, 72.878], zoom: 10 },
};

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedIds, setScannedIds] = useState<string[] | null>(null);
  const [cityFilter, setCityFilter] = useState<CityFilter>("all");

  // Custom drawn parcel state
  const [drawnPolygon, setDrawnPolygon] = useState<[number, number][] | null>(null);
  const [parcelName, setParcelName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(-1);

  // Live market enrichment
  const [market, setMarket] = useState<LocalityMarket | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const enrichAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchParcels()
      .then(({ parcels }) => {
        setParcels(parcels);
        setSelectedId(parcels[0]?.id ?? null);
      })
      .catch(() => setLoadError(true));
  }, []);

  const selected = parcels.find((p) => p.id === selectedId) ?? null;
  const cityFiltered = cityFilter === "all" ? parcels : parcels.filter((p) => p.city === cityFilter);
  const visible = scannedIds === null ? cityFiltered : cityFiltered.filter((p) => scannedIds.includes(p.id));
  const mapConfig = CITY_MAP_CONFIG[cityFilter];

  // Auto-fetch live market data whenever a non-blocked parcel is selected
  useEffect(() => {
    if (!selected || selected.blocked || drawnPolygon) {
      setMarket(null);
      setMarketError(null);
      return;
    }
    enrichAbortRef.current?.abort();
    setMarket(null);
    setMarketError(null);
    setMarketLoading(true);
    enrichLocality(selected.area)
      .then(setMarket)
      .catch((err: Error) => setMarketError(err.message))
      .finally(() => setMarketLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function handleParcelDrawn(polygon: [number, number][]) {
    setDrawnPolygon(polygon);
    setParcelName("");
    setSelectedId(null);
    setAnalyzing(false);
    setAnalyzeStep(-1);
  }

  async function startAnalysis() {
    if (!drawnPolygon || parcels.length === 0) return;
    setAnalyzing(true);

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalyzeStep(i);
      await new Promise<void>((r) => setTimeout(r, i === 0 ? 500 : 750));
    }

    const syntheticParcel = generateParcelFromPolygon(drawnPolygon, parcels, parcelName);
    localStorage.setItem(`landsight.parcel.${syntheticParcel.id}`, JSON.stringify(syntheticParcel));
    navigate(`/analyze?ids=${syntheticParcel.id}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Land discovery</h1>
            <p className="text-sm text-muted-foreground">
              Scan any area to detect undeveloped land, or use{" "}
              <span className="font-medium text-foreground">Draw parcel</span> to trace a custom boundary and analyse it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: "#16a34a88", borderColor: "#16a34a" }} /> Undeveloped</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: "#d9770688", borderColor: "#d97706" }} /> Partial</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border" style={{ background: "#64748b66", borderColor: "#64748b" }} /> Developed</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-dashed" style={{ background: "#dc262633", borderColor: "#dc2626" }} /> FTL - no construction</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-dashed" style={{ background: "#3b82f633", borderColor: "#2563eb" }} /> Custom drawn</span>
          </div>
        </div>

        {loadError && (
          <Card><CardContent className="py-3 text-sm text-destructive">
            API unreachable - check VITE_API_URL and that the backend is running.
          </CardContent></Card>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-4 lg:items-start">
          <Card className="overflow-hidden !p-0">
            <div className="h-[680px] w-full">
              {parcels.length > 0 ? (
                <ParcelMap
                  parcels={parcels}
                  selectedId={selectedId}
                  onSelect={(id) => { setSelectedId(id); setDrawnPolygon(null); setAnalyzing(false); }}
                  scannedIds={scannedIds}
                  onScanStart={() => { setScanState("scanning"); setScannedIds(null); }}
                  onScanComplete={({ ids }) => {
                    setScanState("done");
                    setScannedIds(ids);
                    if (ids.length > 0) setSelectedId(ids[0]);
                  }}
                  onParcelDrawn={handleParcelDrawn}
                  center={mapConfig.center}
                  zoom={mapConfig.zoom}
                />
              ) : (
                <div className="h-full w-full bg-muted animate-pulse" />
              )}
            </div>
          </Card>

          <div className="space-y-3 lg:max-h-[680px] lg:overflow-y-auto lg:pr-0.5">
            <div className="flex gap-1 flex-wrap">
              {(["all", "Hyderabad", "Bangalore", "Mumbai"] as CityFilter[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCityFilter(c);
                    setScannedIds(null);
                    setScanState("idle");
                    setDrawnPolygon(null);
                    const firstMatch = parcels.find((p) => c === "all" || p.city === c);
                    setSelectedId(firstMatch?.id ?? null);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                    cityFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted",
                  )}
                >
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {scanState === "done" ? "Detected in scanned area" : "Parcels in view"}
                  </span>
                  {scanState === "done" && (
                    <button className="text-xs text-primary hover:underline font-normal" onClick={() => { setScannedIds(null); setScanState("idle"); }}>
                      Show all
                    </button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="!px-2 max-h-[300px] overflow-auto space-y-1">
                {scanState === "scanning" ? (
                  <ScanShimmer />
                ) : visible.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    <ScanSearch className="h-5 w-5 mx-auto mb-2 opacity-60" />
                    {scanState === "done"
                      ? "No open land detected in the scanned area. Try a wider rectangle."
                      : cityFilter !== "all"
                      ? `No parcels listed for ${cityFilter} yet.`
                      : "Use the scan tool on the map to detect available land."}
                  </div>
                ) : (
                  visible.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedId(p.id); setDrawnPolygon(null); setAnalyzing(false); }}
                      className={cn(
                        "w-full text-left rounded-md p-3 border transition-colors",
                        selectedId === p.id && !drawnPolygon ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {p.area}
                          </div>
                        </div>
                        {statusBadge(p)}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                        <span>{p.acres} acres - {p.category}</span>
                        <span className="font-medium text-foreground">Rs {p.pricePerSft.toLocaleString("en-IN")}/sft</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Custom drawn parcel panel */}
            {drawnPolygon ? (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-blue-700">
                      <Pencil className="h-4 w-4" />
                      Custom drawn parcel
                    </span>
                    {!analyzing && (
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => { setDrawnPolygon(null); setAnalyzing(false); setAnalyzeStep(-1); }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!analyzing ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Stat label="Estimated area" value={`~${estimateAcres(drawnPolygon).toFixed(2)} ac`} />
                        <Stat label="Vertices" value={`${drawnPolygon.length}`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-blue-700">Name this parcel</label>
                        <Input
                          value={parcelName}
                          onChange={(e) => setParcelName(e.target.value)}
                          placeholder="e.g. Nanakramguda Plot A"
                          className="text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">Saved so you can compare it with other parcels later.</p>
                      </div>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={startAnalysis}
                        disabled={parcels.length === 0 || !parcelName.trim()}
                      >
                        <Sparkles className="h-4 w-4" />
                        Analyse this location
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </>
                  ) : (
                    <AnalysisProgress step={analyzeStep} steps={ANALYSIS_STEPS} />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2"><CardTitle>Selected parcel</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {selected ? (
                    <>
                      <div>
                        <div className="font-semibold">{selected.name}</div>
                        <div className="text-xs text-muted-foreground">{selected.area}</div>
                      </div>

                      {selected.blocked && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-2.5 text-xs text-destructive flex gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                          {selected.blockedReason}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Stat label="Area" value={`${selected.acres} ac`} />
                        <Stat label="Status" value={selected.blocked ? "Blocked" : selected.status} />
                        <Stat label="Category" value={selected.category} />
                        <Stat label="Land rate" value={`Rs ${selected.pricePerSft.toLocaleString("en-IN")}/sft`} />
                        <Stat label="Land outlay" value={`Rs ${selected.landOutlayCr.toLocaleString("en-IN")} Cr`} />
                        <Stat label="Apt. bench" value={`Rs ${selected.areaRatePerSft.toLocaleString("en-IN")}/sft`} />
                      </div>

                      {/* Live market data panel */}
                      <LiveMarketPanel
                        loading={marketLoading}
                        market={market}
                        error={marketError}
                        onRefresh={() => {
                          setMarket(null);
                          setMarketError(null);
                          setMarketLoading(true);
                          enrichLocality(selected.area)
                            .then(setMarket)
                            .catch((e: Error) => setMarketError(e.message))
                            .finally(() => setMarketLoading(false));
                        }}
                      />

                      <Button
                        className="w-full"
                        disabled={selected.blocked}
                        onClick={() => navigate(`/analyze?ids=${selected.id}`)}
                      >
                        <Sparkles className="h-4 w-4" />
                        {selected.blocked ? "Construction not possible" : "Analyse this parcel"}
                        {!selected.blocked && <ArrowRight className="h-4 w-4 ml-auto" />}
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Pick a parcel on the map, scan an area, or use <strong>Draw parcel</strong> to trace a custom boundary.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LiveMarketPanel({
  loading, market, error, onRefresh,
}: {
  loading: boolean;
  market: LocalityMarket | null;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-2 pt-1 border-t mt-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Building2 className="h-3 w-3" /> Live nearby projects
        </div>
        {!loading && (
          <button onClick={onRefresh} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Searching 99acres for nearby projects…
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-[11px] text-destructive/80 bg-destructive/5 rounded p-2">
          Could not fetch live data — {error.slice(0, 80)}
        </div>
      )}

      {market && !loading && (
        <div className="space-y-2">
          {/* Summary row */}
          <div className="flex items-center gap-3 text-xs">
            {market.avgRate > 0 && (
              <span className="font-semibold text-foreground">
                Avg Rs {market.avgRate.toLocaleString("en-IN")}/sft
              </span>
            )}
            {market.rateRange.min > 0 && (
              <span className="text-muted-foreground">
                Rs {market.rateRange.min.toLocaleString("en-IN")}–{market.rateRange.max.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Project list */}
          <div className="space-y-1">
            {market.societies.slice(0, 5).map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between rounded border bg-muted/30 px-2.5 py-2 text-[11px] hover:bg-muted transition-colors gap-2"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{s.name}</div>
                  <div className="text-muted-foreground">{s.configs} · {s.priceLabel} · {s.distanceKm} km</div>
                </div>
                <div className="shrink-0 text-right">
                  {s.pricePerSqft > 0 && (
                    <div className="font-semibold text-foreground">
                      Rs {s.pricePerSqft.toLocaleString("en-IN")}/sft
                    </div>
                  )}
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground ml-auto mt-0.5" />
                </div>
              </a>
            ))}
          </div>

          {/* Insights */}
          {market.insights.length > 0 && (
            <div className="space-y-1 pt-1">
              {market.insights.map((ins, i) => (
                <div key={i} className="flex gap-1.5 text-[11px] text-muted-foreground">
                  <TrendingUp className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                  {ins}
                </div>
              ))}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground/60">
            Source: 99acres · {new Date(market.fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisProgress({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="space-y-2 py-1">
      <div className="text-xs text-blue-700 font-medium flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Building analysis...
      </div>
      <div className="space-y-2">
        {steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className={cn("flex items-center gap-2 text-xs transition-colors", done ? "text-blue-600" : active ? "text-foreground" : "text-muted-foreground/40")}>
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              ) : active ? (
                <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                </span>
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
              )}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScanShimmer() {
  return (
    <div className="space-y-2 p-1">
      <div className="text-xs text-muted-foreground px-2 pt-1 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
        Analyzing satellite imagery...
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-md border p-3 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
