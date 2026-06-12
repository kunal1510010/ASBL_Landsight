/**
 * Scrapes 99acres.com for residential project data in a given locality.
 * No API key required — uses the public 99acres search page.
 */

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

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

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractPsf(chunk: string): number {
  // Find area+price card pairs in configSummary
  // Area values: 400-7000 sqft; price values: > 1,000,000 Rs
  const psfs: number[] = [];

  // Pattern: area block then price block in configSummary cards
  const configIdx = chunk.indexOf('"configSummary"');
  const configChunk = configIdx > -1 ? chunk.slice(configIdx, configIdx + 3000) : chunk;

  // Match area ranges: "min":1380,"max":1380 (sqft values)
  const areaRe = /"min":(\d{3,5}),"max":\d{3,5}/g;
  // Match price ranges following area: "min":12694620
  const priceRe = /"min":(\d{7,9}),"max":\d{7,9}/g;

  const areas: number[] = [];
  const prices: number[] = [];

  let m: RegExpExecArray | null;
  while ((m = areaRe.exec(configChunk)) !== null) {
    const v = parseInt(m[1]);
    if (v >= 400 && v <= 7000) areas.push(v);
  }
  while ((m = priceRe.exec(configChunk)) !== null) {
    prices.push(parseInt(m[1]));
  }

  const pairs = Math.min(areas.length, prices.length);
  for (let i = 0; i < pairs; i++) {
    const psf = Math.round(prices[i] / areas[i]);
    if (psf >= 2000 && psf <= 50000) psfs.push(psf);
  }

  if (psfs.length === 0) return 0;
  return Math.round(psfs.reduce((s, v) => s + v, 0) / psfs.length);
}

function extractConfigs(chunk: string): string {
  const found: string[] = [];
  const re = /"label":"([2-5] BHK)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk)) !== null) {
    if (!found.includes(m[1])) found.push(m[1]);
  }
  return found.length > 0 ? found.map((c) => c.replace(" BHK", "")).join(", ") + " BHK" : "";
}

function extractDistance(chunk: string): number {
  const m = chunk.match(/"subHeading":"([\d.]+)\s*[kK]m"/);
  return m ? parseFloat(m[1]) : 5.0;
}

function extractProjects(html: string, locality: string): ScrapedProject[] {
  const results: ScrapedProject[] = [];
  const seen = new Set<string>();
  let pos = 0;

  while (results.length < 6) {
    const pnIdx = html.indexOf('"projectName":', pos);
    if (pnIdx === -1) break;

    const nameMatch = html.slice(pnIdx).match(/^"projectName":"([^"]{3,80})"/);
    const name = nameMatch?.[1];
    if (!name || seen.has(name)) {
      pos = pnIdx + 1;
      continue;
    }
    seen.add(name);

    const chunk = html.slice(Math.max(0, pnIdx - 2000), pnIdx + 4000);

    // Skip if no price label (non-project entries)
    const priceLabel = chunk.match(/"label":"([\d.]+ ?[-–] ?[\d.]+ ?Cr[^"]*)"/)?.[1];
    if (!priceLabel) {
      pos = pnIdx + 1;
      continue;
    }

    const psf = extractPsf(chunk);
    const configs = extractConfigs(chunk);
    const distKm = extractDistance(chunk);

    const slug = toSlug(name);
    const locSlug = toSlug(locality);
    const url = `https://www.99acres.com/${slug}-in-${locSlug}-hyderabad-PPPPPPPP`.replace(
      "-PPPPPPPP",
      ""
    );

    results.push({
      name,
      url: `https://www.99acres.com/search/project?projectName=${encodeURIComponent(name)}&city=Hyderabad`,
      pricePerSqft: psf,
      configs: configs || "2, 3 BHK",
      priceLabel,
      distanceKm: distKm,
    });

    pos = pnIdx + 1;
  }

  return results;
}

export async function scrapeLocality(locality: string): Promise<LocalityMarket> {
  const slug = toSlug(locality);
  const url = `https://www.99acres.com/flats-in-${slug}-hyderabad-ffid`;

  const res = await fetch(url, { headers: HEADERS as Record<string, string> });
  if (!res.ok) {
    throw new Error(`99acres returned HTTP ${res.status} for ${url}`);
  }

  const html = await res.text();
  if (html.length < 10000) {
    throw new Error("Response too short — likely blocked or redirected");
  }

  const projects = extractProjects(html, locality);
  if (projects.length === 0) {
    throw new Error(`No projects found for ${locality} — locality slug may not match 99acres`);
  }

  // Build market stats from projects that have valid psf
  const withPsf = projects.filter((p) => p.pricePerSqft > 0);
  const psfs = withPsf.map((p) => p.pricePerSqft);
  const avgRate = psfs.length > 0 ? Math.round(psfs.reduce((s, v) => s + v, 0) / psfs.length) : 0;
  const rateMin = psfs.length > 0 ? Math.min(...psfs) : 0;
  const rateMax = psfs.length > 0 ? Math.max(...psfs) : 0;

  // Generate contextual insights from the data
  const insights: string[] = [];
  if (avgRate > 0) {
    insights.push(`Average apartment rate Rs ${avgRate.toLocaleString("en-IN")}/sqft across ${projects.length} active projects`);
  }
  if (rateMax > rateMin && rateMin > 0) {
    const spread = Math.round(((rateMax - rateMin) / rateMin) * 100);
    insights.push(`Wide pricing spread (${spread}%) indicating mix of luxury and mid-segment supply`);
  }
  const closeProjects = projects.filter((p) => p.distanceKm < 3).length;
  if (closeProjects >= 2) {
    insights.push(`${closeProjects} active projects within 3 km — high supply pipeline, buyer-favorable market`);
  }

  return {
    societies: projects,
    avgRate,
    rateRange: { min: rateMin, max: rateMax },
    yoyGrowthPct: null, // 99acres doesn't expose this on search pages
    insights,
    locality,
    fetchedAt: new Date().toISOString(),
    source: "99acres",
  };
}
