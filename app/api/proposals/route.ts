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

async function ensureSchema() {
  const { env } = await import("cloudflare:workers");
  const d1 = env.DB;
  if (!d1) throw new Error("A base compartilhada está indisponível.");
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY NOT NULL, code TEXT UNIQUE NOT NULL,
      client TEXT DEFAULT 'Novo cliente' NOT NULL, project TEXT DEFAULT 'Novo projeto' NOT NULL,
      status TEXT DEFAULT 'draft' NOT NULL, data_json TEXT NOT NULL,
      manual_html TEXT DEFAULT '' NOT NULL, public_token TEXT UNIQUE,
      accepted_by TEXT DEFAULT '' NOT NULL, accepted_email TEXT DEFAULT '' NOT NULL,
      accepted_document TEXT DEFAULT '' NOT NULL, accepted_at TEXT,
      created_by TEXT DEFAULT 'Equipe Sona' NOT NULL, updated_by TEXT DEFAULT 'Equipe Sona' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals (status, updated_at)"),
    d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS proposals_public_token_unique ON proposals (public_token)"),
  ]);
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
    await ensureSchema();
    const db = await getDb();
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
    await ensureSchema();
    const db = await getDb();

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
        status: "finalized", publicToken: token, updatedBy: actor, updatedAt: sql`CURRENT_TIMESTAMP`,
      }).where(eq(proposals.id, id)).returning();
      return Response.json({ proposal: mapProposal(saved) });
    }

    if (payload.action === "markSent") {
      const [saved] = await db.update(proposals).set({
        status: "sent", updatedBy: actor, updatedAt: sql`CURRENT_TIMESTAMP`,
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
