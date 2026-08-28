import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazily created so importing this module (e.g. during `next build` route
// analysis) never throws just because env vars aren't loaded yet — the
// connection string is only required once a query actually runs.
let cachedSql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (cachedSql) return cachedSql;

  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL_UNPOOLED;

  if (!connectionString) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or POSTGRES_URL) — run `vercel env pull .env.local` after connecting the Postgres database in the Vercel dashboard."
    );
  }

  cachedSql = neon(connectionString);
  return cachedSql;
}

export interface Rsvp {
  id: number;
  name: string;
  attending: boolean;
  created_at: string;
}

export async function insertRsvp(name: string, attending: boolean): Promise<Rsvp> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO rsvps (name, attending)
    VALUES (${name}, ${attending})
    RETURNING id, name, attending, created_at
  `;
  return rows[0] as Rsvp;
}

export async function getAllRsvps(): Promise<Rsvp[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, attending, created_at
    FROM rsvps
    ORDER BY created_at DESC
  `;
  return rows as Rsvp[];
}

export async function deleteRsvp(id: number): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM rsvps WHERE id = ${id}`;
}
