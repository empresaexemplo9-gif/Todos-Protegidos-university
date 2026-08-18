// Conexão com o Postgres gerenciado (Neon) e criação do schema sob demanda.
// Usa o driver HTTP do Neon: sem pool de conexões, ideal para funções serverless.
import { neon } from "@neondatabase/serverless";

const CONNECTION =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

let client = null;

function getClient() {
  if (!client) {
    if (!CONNECTION)
      throw new Error(
        "Banco de dados não configurado. Defina DATABASE_URL (ou POSTGRES_URL) nas variáveis de ambiente.",
      );
    client = neon(CONNECTION);
  }
  return client;
}

// Consultas com valores interpolados: sql`SELECT ... ${valor}` (sempre parametrizado).
export function sql(...args) {
  return getClient()(...args);
}

// Comandos sem parâmetros (DDL). O driver do Neon só aceita string por .query().
export function execute(text, params = []) {
  return getClient().query(text, params);
}

// Datas e horas ficam em texto ISO (mesmo formato do servidor local), para que a
// ordenação e o contrato das APIs sejam idênticos nos dois back-ends.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS sona_meta (
     key text PRIMARY KEY,
     value jsonb NOT NULL DEFAULT '{}'::jsonb
   )`,
  `CREATE TABLE IF NOT EXISTS sona_users (
     id text PRIMARY KEY,
     name text NOT NULL DEFAULT '',
     email text NOT NULL UNIQUE,
     role text NOT NULL DEFAULT 'member',
     salt text NOT NULL,
     hash text NOT NULL,
     active boolean NOT NULL DEFAULT true,
     created_by text NOT NULL DEFAULT '',
     created_at text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS sona_catalog_items (
     id text PRIMARY KEY,
     kind text NOT NULL DEFAULT 'equipment',
     name text NOT NULL,
     category text NOT NULL DEFAULT '',
     brand text NOT NULL DEFAULT '',
     model text NOT NULL DEFAULT '',
     sku text NOT NULL DEFAULT '',
     system text NOT NULL DEFAULT 'UNIVERSAL',
     description text NOT NULL DEFAULT '',
     source_url text NOT NULL DEFAULT '',
     unit text NOT NULL DEFAULT 'un',
     purchase_price double precision NOT NULL DEFAULT 0,
     sale_price double precision NOT NULL DEFAULT 0,
     updated_by text NOT NULL DEFAULT '',
     created_at text NOT NULL DEFAULT '',
     updated_at text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS sona_budgets (
     id text PRIMARY KEY,
     code text NOT NULL,
     client text NOT NULL DEFAULT 'Novo cliente',
     project text NOT NULL DEFAULT 'Novo projeto',
     status text NOT NULL DEFAULT 'draft',
     validity_days integer NOT NULL DEFAULT 10,
     discount_percent double precision NOT NULL DEFAULT 0,
     adjustment double precision NOT NULL DEFAULT 0,
     notes text NOT NULL DEFAULT '',
     created_by text NOT NULL DEFAULT '',
     updated_by text NOT NULL DEFAULT '',
     created_at text NOT NULL DEFAULT '',
     updated_at text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS sona_budget_items (
     id text PRIMARY KEY,
     budget_id text NOT NULL REFERENCES sona_budgets(id) ON DELETE CASCADE,
     catalog_item_id text,
     kind text NOT NULL DEFAULT 'equipment',
     name text NOT NULL DEFAULT '',
     category text NOT NULL DEFAULT '',
     brand text NOT NULL DEFAULT '',
     model text NOT NULL DEFAULT '',
     sku text NOT NULL DEFAULT '',
     unit text NOT NULL DEFAULT 'un',
     environment text NOT NULL DEFAULT 'Geral',
     quantity double precision NOT NULL DEFAULT 1,
     purchase_price double precision NOT NULL DEFAULT 0,
     sale_price double precision NOT NULL DEFAULT 0,
     discount_percent double precision NOT NULL DEFAULT 0,
     sort_order integer NOT NULL DEFAULT 0,
     created_at text NOT NULL DEFAULT '',
     updated_at text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS sona_proposals (
     id text PRIMARY KEY,
     code text NOT NULL,
     client text NOT NULL DEFAULT 'Novo cliente',
     project text NOT NULL DEFAULT 'Novo projeto',
     status text NOT NULL DEFAULT 'draft',
     data jsonb,
     manual_html text NOT NULL DEFAULT '',
     public_token text UNIQUE,
     accepted_by text NOT NULL DEFAULT '',
     accepted_email text NOT NULL DEFAULT '',
     accepted_document text NOT NULL DEFAULT '',
     accepted_at text,
     created_by text NOT NULL DEFAULT '',
     updated_by text NOT NULL DEFAULT '',
     created_at text NOT NULL DEFAULT '',
     updated_at text NOT NULL DEFAULT ''
   )`,
  `CREATE INDEX IF NOT EXISTS sona_budget_items_budget_idx ON sona_budget_items (budget_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS sona_proposals_updated_idx ON sona_proposals (updated_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS sona_proposals_code_idx ON sona_proposals (code)`,
];

let schemaReady = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const [row] = await sql`SELECT to_regclass('public.sona_proposals') AS exists`;
      if (row?.exists) return;
      for (const statement of SCHEMA) await execute(statement);
    })().catch((error) => {
      schemaReady = null; // permite nova tentativa na próxima requisição
      throw error;
    });
  }
  return schemaReady;
}

export async function getMeta(key, fallback = null) {
  const rows = await sql`SELECT value FROM sona_meta WHERE key = ${key}`;
  return rows.length ? rows[0].value : fallback;
}

export async function setMeta(key, value) {
  await sql`
    INSERT INTO sona_meta (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}
