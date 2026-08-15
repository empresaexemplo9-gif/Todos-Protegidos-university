import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;
let cached: Database | null = null;

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

export async function getDb(): Promise<Database> {
  if (cached) return cached;
  const url = connectionString();
  if (!url) {
    throw new Error(
      "Banco indisponível. Configure DATABASE_URL (Vercel Postgres / Neon) nas variáveis de ambiente."
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}
