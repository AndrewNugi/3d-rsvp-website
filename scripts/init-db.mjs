// Creates the rsvps table. Run after `vercel env pull .env.local`:
//   node --env-file=.env.local scripts/init-db.mjs
import { Client } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error(
    "No database connection string found in the environment.\n" +
      "Run `vercel env pull .env.local` first, then re-run this script with:\n" +
      "  node --env-file=.env.local scripts/init-db.mjs"
  );
  process.exit(1);
}

const schemaPath = fileURLToPath(new URL("../db/schema.sql", import.meta.url));
const schema = readFileSync(schemaPath, "utf8");

const client = new Client(connectionString);
await client.connect();
try {
  await client.query(schema);
  console.log("rsvps table created (or already existed).");
} finally {
  await client.end();
}
