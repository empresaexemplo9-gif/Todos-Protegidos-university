import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { proposals } from "../../../db/schema";
import { adminActorFrom } from "../../admin-access";

type ProposalStatus = "draft" | "finalized" | "sent" | "accepted";

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  if (message.includes("no such table")) return "A base de propostas ainda não foi preparada.";
  return "Não foi possível acessar a base de propostas.";
}

function safeJson(value: string) {
  try { return JSON.parse(value) as unknown; } catch { return null; }
}

function sanitizeDocumentHtml(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .slice(0, 1_500_000)
    .replace(/<\/?(?:script|style|iframe|object|embed|form)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(?:javascript|data:text\/html)\s*:/gi, "");
}

let schemaReady = false;
async function ensureSchema(db: Awaited<ReturnType<typeof getDb>>) {
  if (schemaReady) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS proposals (
    id text PRIMARY KEY, code text NOT NULL UNIQUE,
    client text NOT NULL DEFAULT 'Novo cliente', project text NOT NULL DEFAULT 'Novo projeto',
    status text NOT NULL DEFAULT 'draft', data_json text NOT NULL,
    manual_html text NOT NULL DEFAULT '', public_token text UNIQUE,
    accepted_by text NOT NULL DEFAULT '', accepted_email text NOT NULL DEFAULT '',
    accepted_document text NOT NULL DEFAULT '', accepted_at text,
    created_by text NOT NULL DEFAULT 'Equipe Sona', updated_by text NOT NULL DEFAULT 'Equipe Sona',
    created_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    updated_at text NOT NULL DEFAULT to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals (status, updated_at)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS proposals_public_token_unique ON proposals (public_token)`);
  schemaReady = true;
}

function mapProposal(row: typeof proposals.$inferSelect, includeData = true, includePrivateAcceptance = true) {
  return {
    id: row.id,
    code: row.code,
    client: row.client,
    project: row.project,
    status: row.status,
    ...(includeData ? { data: safeJson(row.dataJson), manualHtml: row.manualHtml } : {}),
    publicToken: row.publicToken,
    acceptedBy: row.acceptedBy,
    ...(includePrivateAcceptance ? { acceptedEmail: row.acceptedEmail, acceptedDocument: row.acceptedDocument } : {}),
    acceptedAt: row.acceptedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const db = await getDb();
    await ensureSchema(db);
    const token = clean(new URL(request.url).searchParams.get("token"), 120);
    if (token) {
      const [row] = await db.select().from(proposals).where(eq(proposals.publicToken, token));
      if (!row || row.status === "draft") return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
      return Response.json({ proposal: mapProposal(row, true, false) });
    }
    if (!(await adminActorFrom(request))) return Response.json({ error: "Acesso administrativo necessário." }, { status: 401 });
    const rows = await db.select().from(proposals).orderBy(desc(proposals.updatedAt));
    return Response.json({ proposals: rows.map((row) => mapProposal(row)) });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as {
      action?: "saveDraft" | "finalize" | "markSent" | "accept" | "delete";
      id?: string;
      token?: string;
      code?: string;
      client?: string;
      project?: string;
      data?: unknown;
      manualHtml?: string;
      acceptance?: { name?: string; email?: string; document?: string; confirmed?: boolean };
    };
    const db = await getDb();
    await ensureSchema(db);

    if (payload.action === "accept") {
      const token = clean(payload.token, 120);
      const name = clean(payload.acceptance?.name, 140);
      const email = clean(payload.acceptance?.email, 180);
      const document = clean(payload.acceptance?.document, 40);
      if (!token || !name || !email || !document || payload.acceptance?.confirmed !== true) {
        return Response.json({ error: "Preencha os dados e confirme o aceite." }, { status: 400 });
      }
      const [row] = await db.select().from(proposals).where(eq(proposals.publicToken, token));
      if (!row || row.status === "draft") return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
      if (row.status === "accepted") return Response.json({ proposal: mapProposal(row, true, false) });
      const acceptedAt = new Date().toISOString();
      const [accepted] = await db.update(proposals).set({
        status: "accepted", acceptedBy: name, acceptedEmail: email,
        acceptedDocument: document, acceptedAt, updatedAt: acceptedAt,
      }).where(eq(proposals.id, row.id)).returning();
      return Response.json({ proposal: mapProposal(accepted, true, false) });
    }

    const actor = await adminActorFrom(request);
    if (!actor) return Response.json({ error: "Acesso administrativo necessário." }, { status: 401 });
    const id = clean(payload.id, 100);

    if (payload.action === "saveDraft") {
      const code = clean(payload.code, 80);
      if (!code || payload.data === undefined) return Response.json({ error: "Dados da proposta incompletos." }, { status: 400 });
      const dataJson = JSON.stringify(payload.data);
      if (dataJson.length > 1_750_000) return Response.json({ error: "A proposta excedeu o limite de imagens. Remova algumas imagens ou use arquivos menores." }, { status: 413 });
      const values = {
        code, client: clean(payload.client, 160) || "Novo cliente",
        project: clean(payload.project, 160) || "Novo projeto", dataJson,
        manualHtml: sanitizeDocumentHtml(payload.manualHtml), status: "draft" as ProposalStatus,
        updatedBy: actor, updatedAt: new Date().toISOString(),
      };
      if (id) {
        const [saved] = await db.update(proposals).set(values).where(eq(proposals.id, id)).returning();
        if (!saved) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });
        return Response.json({ proposal: mapProposal(saved) });
      }
      const [saved] = await db.insert(proposals).values({
        id: crypto.randomUUID(), ...values, createdBy: actor,
      }).onConflictDoUpdate({ target: proposals.code, set: values }).returning();
      return Response.json({ proposal: mapProposal(saved) });
    }

    if (!id) return Response.json({ error: "Proposta inválida." }, { status: 400 });
    const [row] = await db.select().from(proposals).where(eq(proposals.id, id));
    if (!row) return Response.json({ error: "Proposta não encontrada." }, { status: 404 });

    if (payload.action === "finalize") {
      const token = row.publicToken || `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
      const [saved] = await db.update(proposals).set({
        status: "finalized", publicToken: token, updatedBy: actor, updatedAt: new Date().toISOString(),
      }).where(eq(proposals.id, id)).returning();
      return Response.json({ proposal: mapProposal(saved) });
    }

    if (payload.action === "markSent") {
      const [saved] = await db.update(proposals).set({
        status: "sent", updatedBy: actor, updatedAt: new Date().toISOString(),
      }).where(eq(proposals.id, id)).returning();
      return Response.json({ proposal: mapProposal(saved) });
    }

    if (payload.action === "delete") {
      await db.delete(proposals).where(eq(proposals.id, id));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
