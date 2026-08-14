import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const catalogItems = sqliteTable("catalog_items", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["equipment", "service"] }).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  brand: text("brand").notNull().default(""),
  model: text("model").notNull().default(""),
  sku: text("sku").notNull().default(""),
  system: text("system").notNull().default("UNIVERSAL"),
  description: text("description").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  unit: text("unit").notNull().default("un"),
  purchasePriceCents: integer("purchase_price_cents").notNull().default(0),
  salePriceCents: integer("sale_price_cents").notNull().default(0),
  updatedBy: text("updated_by").notNull().default("Equipe Sona"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const budgetLines = sqliteTable("budget_lines", {
  catalogItemId: text("catalog_item_id")
    .primaryKey()
    .references(() => catalogItems.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull().default(0),
  updatedBy: text("updated_by").notNull().default("Equipe Sona"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  client: text("client").notNull().default("Novo cliente"),
  project: text("project").notNull().default("Novo projeto"),
  status: text("status", { enum: ["draft", "sent", "approved"] }).notNull().default("draft"),
  validityDays: integer("validity_days").notNull().default(10),
  discountPercent: real("discount_percent").notNull().default(0),
  adjustmentCents: integer("adjustment_cents").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdBy: text("created_by").notNull().default("Equipe Sona"),
  updatedBy: text("updated_by").notNull().default("Equipe Sona"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const budgetItems = sqliteTable("budget_items", {
  id: text("id").primaryKey(),
  budgetId: text("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
  catalogItemId: text("catalog_item_id").references(() => catalogItems.id, { onDelete: "set null" }),
  kind: text("kind", { enum: ["equipment", "service"] }).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  brand: text("brand").notNull().default(""),
  model: text("model").notNull().default(""),
  sku: text("sku").notNull().default(""),
  unit: text("unit").notNull().default("un"),
  environment: text("environment").notNull().default("Geral"),
  quantity: real("quantity").notNull().default(1),
  purchasePriceCents: integer("purchase_price_cents").notNull().default(0),
  salePriceCents: integer("sale_price_cents").notNull().default(0),
  discountPercent: real("discount_percent").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogMeta = sqliteTable("catalog_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  client: text("client").notNull().default("Novo cliente"),
  project: text("project").notNull().default("Novo projeto"),
  status: text("status", { enum: ["draft", "finalized", "sent", "accepted"] }).notNull().default("draft"),
  dataJson: text("data_json").notNull(),
  manualHtml: text("manual_html").notNull().default(""),
  publicToken: text("public_token").unique(),
  acceptedBy: text("accepted_by").notNull().default(""),
  acceptedEmail: text("accepted_email").notNull().default(""),
  acceptedDocument: text("accepted_document").notNull().default(""),
  acceptedAt: text("accepted_at"),
  createdBy: text("created_by").notNull().default("Equipe Sona"),
  updatedBy: text("updated_by").notNull().default("Equipe Sona"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const proposalTemplates = sqliteTable("proposal_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  plan: text("plan").notNull().default("SMARTLIFE"),
  dataJson: text("data_json").notNull(),
  createdBy: text("created_by").notNull().default("Equipe Sona"),
  updatedBy: text("updated_by").notNull().default("Equipe Sona"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
