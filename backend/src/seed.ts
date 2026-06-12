/**
 * Seed Neon Postgres with parcels + finance snapshot.
 * Usage: DATABASE_URL=postgres://... npm run seed
 * Pragmatic hackathon schema: jsonb documents with typed views via API.
 */
import { pool } from "./db.js";
import { PARCEL_DRAFTS } from "./data/parcels-data.js";
import { FINANCE_DATA } from "./data/finance-data.js";

async function main() {
  if (!pool) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parcels (
      id         text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS finance_snapshot (
      id         int PRIMARY KEY CHECK (id = 1),
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  for (const p of PARCEL_DRAFTS) {
    await pool.query(
      `INSERT INTO parcels (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [p.id, JSON.stringify(p)],
    );
  }

  await pool.query(
    `INSERT INTO finance_snapshot (id, data) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(FINANCE_DATA)],
  );

  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM parcels`);
  console.log(`Seeded ${rows[0].n} parcels + finance snapshot (67 months, 8 projects).`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
