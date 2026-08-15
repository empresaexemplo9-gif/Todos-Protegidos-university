# Sona Propostas

Plataforma de **propostas comerciais** da Sona (Next.js 16 + React 19),
pronta para deploy na **Vercel**, com banco **Postgres (Vercel Postgres / Neon)**
via Drizzle ORM e acesso administrativo por **senha**.

Funcionalidades: editor inteligente de propostas (rascunho, finalização, link
público e aceite do cliente), editor tipo Word, catálogo de equipamentos e
serviços, orçamento com cálculo automático, planos **SMARTLIFE / VETRA /
SCENARIO**, editor técnico de planta (upload de PDF/imagem, marcadores, mapa de
calor Wi‑Fi) e a gestão comercial: **Clientes**, **Relatórios** e **Modelos**.

## 🚀 Deploy na Vercel

Veja o passo a passo em [`DEPLOY.md`](./DEPLOY.md). Resumo:

1. Conecte este repositório na Vercel (framework detectado: **Next.js**).
2. Adicione um banco **Postgres** (Storage → Postgres/Neon) — a Vercel injeta a
   variável `DATABASE_URL` automaticamente.
3. Defina a variável **`ADMIN_PASSWORD`** (senha de acesso da equipe).
4. Deploy. O schema e o catálogo inicial são criados sozinhos no primeiro acesso.

## 🧑‍💻 Rodar localmente

```bash
npm install
# .env.local com:
#   DATABASE_URL=postgres://...   (Neon/Vercel Postgres)
#   ADMIN_PASSWORD=suasenha
npm run dev      # http://localhost:3000
```

## 🔐 Acesso

- **Equipe (admin):** `/` pede a senha (`ADMIN_PASSWORD`) e abre o estúdio comercial.
- **Cliente:** recebe a proposta por **link público** (`/proposta?token=…`) — sem login.

## 🗂️ Estrutura

```
app/
  page.tsx              entrada (login por senha → workspace)
  login-gate.tsx        tela de login da equipe
  admin-access.ts       autenticação por senha (cookie de sessão)
  admin-workspace.tsx   propostas, escopo técnico, orçamento, modelos, clientes, relatórios
  proposta/page.tsx     proposta pública + aceite do cliente
  api/
    auth/route.ts       login/logout
    proposals/route.ts  propostas + aceite
    budget/route.ts     catálogo + orçamento
    templates/route.ts  modelos de proposta
db/
  schema.ts             tabelas Drizzle (Postgres)
  index.ts              conexão Neon/Postgres
```

## 🎨 Marca

Identidade **SONA** (verde `#74d8b0`, fonte Bw Modelica) em `public/` e
`app/globals.css`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Desenvolvimento (http://localhost:3000) |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm run db:generate` | Gera migrações Drizzle (opcional) |
