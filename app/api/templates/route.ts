import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { catalogMeta, proposalTemplates } from "../../../db/schema";
import { adminActorFrom } from "../../admin-access";

const PLANS = ["SMARTLIFE", "VETRA", "SCENARIO"] as const;
type Plan = (typeof PLANS)[number];
const templateSeedVersion = "2026-08-14-modelos-v1";

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeJson(value: string) {
  try { return JSON.parse(value) as unknown; } catch { return null; }
}

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  if (message.includes("no such table")) return "A base de modelos ainda não foi preparada.";
  return "Não foi possível acessar a base de modelos.";
}

type TemplateItem = { id: number; category: string; description: string; qty: number; unit: string; unitPrice: number };

function sanitizeItems(value: unknown): TemplateItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      id: index + 1,
      category: clean(item.category, 80),
      description: clean(item.description, 200),
      qty: Number.isFinite(Number(item.qty)) ? Math.max(0, Number(item.qty)) : 1,
      unit: clean(item.unit, 20) || "un",
      unitPrice: Number.isFinite(Number(item.unitPrice)) ? Math.max(0, Number(item.unitPrice)) : 0,
    };
  });
}

function sanitizeData(value: unknown) {
  const data = (value ?? {}) as Record<string, unknown>;
  return {
    overview: clean(data.overview, 4000),
    services: clean(data.services, 4000),
    exclusions: clean(data.exclusions, 4000),
    notes: clean(data.notes, 4000),
    payment: clean(data.payment, 400),
    deadline: clean(data.deadline, 200),
    validity: clean(data.validity, 120),
    discount: Number.isFinite(Number(data.discount)) ? Math.min(100, Math.max(0, Number(data.discount))) : 0,
    items: sanitizeItems(data.items),
  };
}

const starterTemplates: Array<{ id: string; name: string; description: string; plan: Plan; data: ReturnType<typeof sanitizeData> }> = [
  {
    id: "seed-smartlife-casa-conectada",
    name: "Casa Conectada · SmartLife",
    description: "Automação essencial: iluminação, climatização, cenas e comandos por voz.",
    plan: "SMARTLIFE",
    data: sanitizeData({
      overview: "A casa conectada é uma realidade ao seu alcance. Com automação é possível aumentar a segurança, o conforto e a economia, melhorando a qualidade de vida de toda a família.",
      services: "Instalação e configuração dos sistemas descritos\nProgramação de cenas e rotinas personalizadas\nTreinamento e operação assistida\nTestes finais e entrega técnica",
      exclusions: "Passagem de cabos e intervenções civis\nMateriais de infraestrutura elétrica e de rede\nEquipamentos ou serviços não listados no escopo\nAdequações de quadros, eletrodutos ou marcenaria",
      notes: "Infraestrutura civil e elétrica deve estar disponível conforme o escopo. Alterações solicitadas após a aprovação serão orçadas separadamente.",
      payment: "40% na aprovação · 40% na instalação · 20% na entrega",
      deadline: "45 dias após aprovação",
      validity: "10 dias",
      discount: 0,
      items: [
        { category: "Automação", description: "Gateway de automação SmartLife", qty: 1, unit: "un", unitPrice: 0 },
        { category: "Iluminação", description: "Módulo de iluminação / dimerização", qty: 4, unit: "un", unitPrice: 0 },
        { category: "Climatização", description: "Controle IR de ar-condicionado", qty: 2, unit: "un", unitPrice: 0 },
        { category: "Redes Wi-Fi", description: "Access Point UniFi U6+", qty: 2, unit: "un", unitPrice: 0 },
        { category: "Interfaces", description: "Assistente de voz", qty: 2, unit: "un", unitPrice: 0 },
      ],
    }),
  },
  {
    id: "seed-vetra-audio-video",
    name: "Áudio & Vídeo · VETRA",
    description: "Home cinema, multiroom, redes e proteção de energia integrados.",
    plan: "VETRA",
    data: sanitizeData({
      overview: "Integração profissional de áudio, vídeo, multiroom, redes e proteção de energia em uma experiência única, com padrão de projeto e execução VETRA.",
      services: "Projeto e integração dos sistemas de A/V\nConfiguração de multiroom e cenas de mídia\nOrganização de rack técnico e cabeamento\nCalibração, testes e entrega técnica",
      exclusions: "Tratamento acústico e marcenaria\nInfraestrutura elétrica e de rede\nMobiliário e suportes especiais\nItens não listados no escopo",
      notes: "Pontos de energia estabilizada e infraestrutura de rede devem estar disponíveis conforme o projeto. Ajustes após aprovação são orçados à parte.",
      payment: "40% na aprovação · 40% na instalação · 20% na entrega",
      deadline: "50 dias após aprovação",
      validity: "10 dias",
      discount: 0,
      items: [
        { category: "Home cinema", description: "Receiver AV 7.2", qty: 1, unit: "un", unitPrice: 0 },
        { category: "Áudio", description: "Amplificador multiroom", qty: 1, unit: "un", unitPrice: 0 },
        { category: "Áudio", description: "Caixa de embutir (par)", qty: 4, unit: "par", unitPrice: 0 },
        { category: "Redes Wi-Fi", description: "Access Point UniFi U7 Pro", qty: 3, unit: "un", unitPrice: 0 },
        { category: "Proteção de energia", description: "Condicionador / filtro de linha", qty: 1, unit: "un", unitPrice: 0 },
      ],
    }),
  },
  {
    id: "seed-scenario-alto-padrao",
    name: "Alto padrão · SCENARIO",
    description: "Automação centralizada e personalizada com a linha Scenario Embrace.",
    plan: "SCENARIO",
    data: sanitizeData({
      overview: "Automação centralizada, personalizada e de alto padrão com a linha Scenario Embrace, unificando iluminação, cortinas, clima, segurança e cenas em uma interface única.",
      services: "Projeto de automação centralizada\nProgramação de cenas, rotinas e integrações\nComissionamento e operação assistida\nTestes finais e entrega técnica premium",
      exclusions: "Obras civis e marcenaria\nInfraestrutura elétrica e de rede\nEquipamentos de terceiros não homologados\nItens não listados no escopo",
      notes: "Projeto executivo e infraestrutura devem seguir o padrão Scenario. Personalizações após a aprovação são orçadas separadamente.",
      payment: "50% na aprovação · 30% na instalação · 20% na entrega",
      deadline: "60 dias após aprovação",
      validity: "15 dias",
      discount: 0,
      items: [
        { category: "Automação", description: "Central de automação Scenario", qty: 1, unit: "un", unitPrice: 0 },
        { category: "Iluminação", description: "Módulo de iluminação Scenario", qty: 8, unit: "un", unitPrice: 0 },
        { category: "Cortinas", description: "Motor de cortina / persiana", qty: 4, unit: "un", unitPrice: 0 },
        { category: "Comandos", description: "Keypad de cenas", qty: 4, unit: "un", unitPrice: 0 },
        { category: "Segurança", description: "Integração de segurança e acesso", qty: 1, unit: "un", unitPrice: 0 },
      ],
    }),
  },
];

async function ensureSchema() {
  const { env } = await import("cloudflare:workers");
  const d1 = env.DB;
  if (!d1) throw new Error("A base de modelos está indisponível.");
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS proposal_templates (
      id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL,
      description TEXT DEFAULT '' NOT NULL, plan TEXT DEFAULT 'SMARTLIFE' NOT NULL,
      data_json TEXT NOT NULL,
      created_by TEXT DEFAULT 'Equipe Sona' NOT NULL, updated_by TEXT DEFAULT 'Equipe Sona' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS catalog_meta (
      key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
  ]);
}

type Db = Awaited<ReturnType<typeof getDb>>;

async function seedStarters(db: Db) {
  const [meta] = await db.select().from(catalogMeta).where(eq(catalogMeta.key, "templates_seed"));
  if (meta?.value === templateSeedVersion) return;
  const now = new Date().toISOString();
  for (const template of starterTemplates) {
    await db.insert(proposalTemplates).values({
      id: template.id, name: template.name, description: template.description, plan: template.plan,
      dataJson: JSON.stringify(template.data), createdBy: "Equipe Sona", updatedBy: "Equipe Sona",
      createdAt: now, updatedAt: now,
    }).onConflictDoNothing();
  }
  await db.insert(catalogMeta).values({ key: "templates_seed", value: templateSeedVersion, updatedAt: now })
    .onConflictDoUpdate({ target: catalogMeta.key, set: { value: templateSeedVersion, updatedAt: now } });
}

function mapTemplate(row: typeof proposalTemplates.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    plan: row.plan,
    data: safeJson(row.dataJson),
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const db = await getDb();
    if (!(await adminActorFrom(request))) return Response.json({ error: "Acesso administrativo necessário." }, { status: 401 });
    await seedStarters(db);
    const rows = await db.select().from(proposalTemplates).orderBy(desc(proposalTemplates.updatedAt));
    return Response.json({ templates: rows.map(mapTemplate) });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as {
      action?: "save" | "delete";
      id?: string;
      name?: string;
      description?: string;
      plan?: string;
      data?: unknown;
    };
    await ensureSchema();
    const db = await getDb();
    const actor = await adminActorFrom(request);
    if (!actor) return Response.json({ error: "Acesso administrativo necessário." }, { status: 401 });
    const id = clean(payload.id, 100);

    if (payload.action === "delete") {
      if (!id) return Response.json({ error: "Modelo inválido." }, { status: 400 });
      await db.delete(proposalTemplates).where(eq(proposalTemplates.id, id));
      return Response.json({ ok: true });
    }

    if (payload.action === "save") {
      const name = clean(payload.name, 160);
      if (!name) return Response.json({ error: "Informe um nome para o modelo." }, { status: 400 });
      const rawPlan = clean(payload.plan, 40) as Plan;
      const plan: Plan = PLANS.includes(rawPlan) ? rawPlan : "SMARTLIFE";
      const dataJson = JSON.stringify(sanitizeData(payload.data));
      if (dataJson.length > 900_000) return Response.json({ error: "O modelo excedeu o limite de tamanho." }, { status: 413 });
      const now = new Date().toISOString();
      const values = { name, description: clean(payload.description, 300), plan, dataJson, updatedBy: actor, updatedAt: now };
      if (id) {
        const [saved] = await db.update(proposalTemplates).set(values).where(eq(proposalTemplates.id, id)).returning();
        if (!saved) return Response.json({ error: "Modelo não encontrado." }, { status: 404 });
        return Response.json({ template: mapTemplate(saved) });
      }
      const [saved] = await db.insert(proposalTemplates).values({ id: crypto.randomUUID(), ...values, createdBy: actor }).returning();
      return Response.json({ template: mapTemplate(saved) });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
