import type { Parcel, FinanceSummary, LocalityMarket } from "./types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchParcels = () => get<{ source: string; parcels: Parcel[] }>("/api/parcels");
export const fetchParcel = (id: string) => get<Parcel>(`/api/parcels/${id}`);
export const fetchFinance = () => get<FinanceSummary>("/api/finance/summary");

export async function enrichLocality(area: string): Promise<LocalityMarket> {
  const res = await fetch(`${BASE}/api/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ area }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `enrich -> ${res.status}`);
  return data as LocalityMarket;
}
