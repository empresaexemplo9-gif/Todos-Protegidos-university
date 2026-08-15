# Deploy na Vercel — Sona Propostas

App **Next.js** (App Router) com banco **Postgres (Vercel Postgres / Neon)** e
login de admin por **senha**. Sem segredos no código — tudo por variáveis de
ambiente.

## 1) Conectar o repositório

1. Na Vercel: **Add New… → Project** e importe este repositório do GitHub.
2. Framework Preset: **Next.js** (detectado automaticamente). Build/Output
   padrão. Node 20+.

## 2) Banco de dados (Postgres)

1. No projeto da Vercel: **Storage → Create Database → Postgres** (Neon).
2. Conecte o banco ao projeto. A Vercel injeta **`DATABASE_URL`**
   automaticamente (o código também aceita `POSTGRES_URL`).
3. Não é preciso rodar migração: o schema e o **catálogo inicial** (155 itens) e
   os **modelos** de proposta são criados sozinhos na primeira requisição
   (`CREATE TABLE IF NOT EXISTS` + seed idempotente).

## 3) Acesso administrativo

- Defina a variável **`ADMIN_PASSWORD`** (Settings → Environment Variables) com a
  senha da equipe. É ela que libera o painel em `/`.
- Sem `ADMIN_PASSWORD` definida, o painel fica bloqueado (comportamento seguro).

## 4) Deploy

Faça o deploy pela Vercel (ou um push na branch conectada). Ao abrir a URL:

- `/` → tela de login da equipe (senha `ADMIN_PASSWORD`).
- `/proposta?token=…` → proposta pública para o cliente (sem login).

## Rodar localmente

```bash
npm install
# .env.local
#   DATABASE_URL=postgres://usuario:senha@host/banco?sslmode=require
#   ADMIN_PASSWORD=suasenha
npm run dev            # http://localhost:3000
```

> Dica: use a mesma `DATABASE_URL` do Neon no `.env.local` para desenvolver com
> o banco real. Cookies de sessão usam `secure` apenas em produção, então o
> login funciona em `http://localhost`.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | String de conexão Postgres (Vercel/Neon injeta) |
| `ADMIN_PASSWORD` | sim | Senha de acesso do painel administrativo |

## Verificação pós-deploy

1. Abra `/`, entre com a senha → deve abrir o workspace (Propostas, Escopo
   técnico, Orçamento, Modelos, Clientes, Relatórios).
2. Crie e finalize uma proposta, copie o link público e abra em uma aba anônima
   para conferir o aceite do cliente.
