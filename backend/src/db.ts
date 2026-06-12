import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const hasDb = Boolean(process.env.DATABASE_URL);

export const pool: pg.Pool | null = hasDb
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Neon requires TLS
      max: 5,
    })
  : null;

export async function query<T extends pg.QueryResultRow>(text: string, params?: unknown[]): Promise<T[]> {
  if (!pool) throw new Error("DATABASE_URL not configured");
  const res = await pool.query<T>(text, params as never);
  return res.rows;
}
