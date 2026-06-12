import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool, hasDb } from "./db.js";
import { PARCEL_DRAFTS } from "./data/parcels-data.js";
import { FINANCE_DATA } from "./data/finance-data.js";
import { assessLandAcquisition, estimateLandOutlayCr, type MonthCash, type FinancePolicy } from "./engine.js";
import { scrapeLocality } from "./scrape.js";

const app = express();
app.use(cors());
app.use(express.json());

type FinanceDoc = {
  calibration: Record<string, unknown>;
  policy: FinancePolicy;
  projects: unknown[];
  companyMonthly: MonthCash[];
  horizon: unknown;
  generatedFrom: string;
};

/**
 * Data access with graceful fallback: if Neon is unreachable or unseeded,
 * serve the bundled snapshot so the demo never dies on stage.
 */
async function loadFinance(): Promise<{ doc: FinanceDoc; source: "neon" | "bundled" }> {
  if (hasDb && pool) {
    try {
      const { rows } = await pool.query(`SELECT data FROM finance_snapshot WHERE id = 1`);
      if (rows[0]?.data) return { doc: rows[0].data as FinanceDoc, source: "neon" };
    } catch {
      /* fall through */
    }
  }
  return { doc: FINANCE_DATA as unknown as FinanceDoc, source: "bundled" };
}

async function loadParcels(): Promise<{ drafts: typeof PARCEL_DRAFTS; source: "neon" | "bundled" }> {
  if (hasDb && pool) {
    try {
      const { rows } = await pool.query(`SELECT data FROM parcels ORDER BY id`);
      if (rows.length > 0) return { drafts: rows.map((r) => r.data), source: "neon" };
    } catch {
      /* fall through */
    }
  }
  return { drafts: PARCEL_DRAFTS, source: "bundled" };
}

/** Attach computed land outlay + real finance verdict to a parcel draft. */
function withVerdict(draft: (typeof PARCEL_DRAFTS)[number], fin: FinanceDoc) {
  const landOutlayCr = Math.round(estimateLandOutlayCr(draft.acres, draft.pricePerSft));
  if (draft.blocked) {
    return {
      ...draft,
      landOutlayCr,
      financeApproved: false,
      financeNote: `Not assessed - ${draft.blockedReason ?? "construction blocked."}`,
    };
  }
  const a = assessLandAcquisition(landOutlayCr, fin.companyMonthly, fin.policy);
  return { ...draft, landOutlayCr, financeApproved: a.approved, financeNote: a.note };
}

app.get("/api/health", async (_req, res) => {
  let db = "not configured";
  if (hasDb && pool) {
    try {
      await pool.query("SELECT 1");
      db = "connected";
    } catch {
      db = "unreachable (serving bundled data)";
    }
  }
  res.json({ ok: true, db, snapshot: "Jun 2026" });
});

app.get("/api/parcels", async (_req, res) => {
  const [{ drafts, source }, { doc }] = await Promise.all([loadParcels(), loadFinance()]);
  res.json({ source, parcels: drafts.map((d) => withVerdict(d, doc)) });
});

app.get("/api/parcels/:id", async (req, res) => {
  const [{ drafts }, { doc }] = await Promise.all([loadParcels(), loadFinance()]);
  const d = drafts.find((p) => p.id === req.params.id);
  if (!d) return res.status(404).json({ error: "parcel not found" });
  res.json(withVerdict(d, doc));
});

app.get("/api/finance/summary", async (_req, res) => {
  const { doc, source } = await loadFinance();
  res.json({ source, ...doc });
});

app.post("/api/finance/assess", async (req, res) => {
  const { outlayCr, startMonth, spreadMonths } = req.body ?? {};
  if (typeof outlayCr !== "number" || outlayCr <= 0) {
    return res.status(400).json({ error: "outlayCr (positive number, in Rs Cr) is required" });
  }
  const { doc } = await loadFinance();
  res.json(assessLandAcquisition(outlayCr, doc.companyMonthly, doc.policy, { startMonth, spreadMonths }));
});

/** Live market data via 99acres scrape — no API key required */
app.post("/api/enrich", async (req, res) => {
  const raw: string = req.body?.locality ?? req.body?.area ?? "";
  // Accept "Kokapet, Hyderabad" or just "Kokapet"
  const locality = raw.split(",")[0].trim();
  if (!locality) return res.status(400).json({ error: "locality required" });

  try {
    const data = await scrapeLocality(locality);
    return res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[enrich]", locality, msg);
    return res.status(502).json({ error: msg });
  }
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`LandSight API on :${port} (db: ${hasDb ? "configured" : "bundled fallback"})`);
});
