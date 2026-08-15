# Deploy — Sona Propostas

Guia de publicação da plataforma (Next.js 16 + Vinext em **Cloudflare Workers**,
banco **Cloudflare D1** via Drizzle). Este documento **não** contém segredos e
**não** define o `project_id` — apenas descreve os passos.

## Pré-requisitos

- Node.js **>= 22.13**
- Um projeto no **ChatGPT Sites** (recomendado) ou uma conta **Cloudflare** com
  Workers + D1.

## 1) Rodar localmente

```bash
npm install        # ou: npm run install:ci
npm run dev        # sobe o Vite/Vinext em http://localhost:5173
```

- O banco local (Miniflare/D1) é criado automaticamente. As rotas
  (`/api/budget`, `/api/proposals`, `/api/templates`) **criam o schema sob
  demanda** (`CREATE TABLE IF NOT EXISTS`) e **semeiam** o catálogo e os
  modelos iniciais na primeira chamada — não é preciso rodar migração manual.
- **Acesso admin no local:** a página `/` exige identidade (cabeçalho
  `oai-authenticated-user-email`) e que o e-mail esteja em `ADMIN_EMAILS`.
  Para pré-visualizar, crie um arquivo `.dev.vars` (ignorado pelo Git):

  ```env
  ADMIN_EMAILS=seu-email@empresa.com
  ```

  e exponha essa variável ao worker local (o binding é lido de `process.env`).

## 2) Variáveis e acesso

O acesso administrativo é controlado pela identidade do usuário + a lista:

```env
ADMIN_EMAILS=primeiro@empresa.com,segundo@empresa.com
```

> Não coloque senhas nem chaves no código. Configure `ADMIN_EMAILS` como
> variável/secret no ambiente de produção (ChatGPT Sites ou Cloudflare),
> **não** em arquivos versionados.

## 3) Deploy no ChatGPT Sites (recomendado)

1. Em `.openai/hosting.json`, defina o `project_id` do **seu** projeto Sites
   (campo hoje com placeholder) e mantenha o binding D1 `"DB"`.
2. Configure o secret `ADMIN_EMAILS` no projeto Sites.
3. Publique pelo fluxo do próprio ChatGPT Sites. O builder remoto roda
   `npm run build` no commit enviado e valida o artefato do Worker.

## 4) Deploy na Cloudflare (alternativa)

1. Crie um banco **D1** e um binding chamado `DB` para o Worker.
2. Defina `ADMIN_EMAILS` como variável/secret do Worker.
3. Build e publicação:

   ```bash
   npm run build      # gera e valida o artefato do Worker
   npx wrangler deploy
   ```

   Se preferir aplicar as migrações explicitamente (em vez do auto-schema em
   runtime), use os arquivos em `drizzle/` com o D1.

## Verificação pós-deploy

- Acesse a raiz `/` autenticado com um e-mail de `ADMIN_EMAILS` → deve abrir o
  **workspace admin** (Propostas, Escopo técnico, Orçamento, Modelos, Clientes,
  Relatórios).
- Finalize uma proposta e abra o **link público** `/proposta?token=...` para
  conferir o aceite do cliente.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build + validação do artefato Sites |
| `npm test` | Build + teste de metadados de render |
| `npm run db:generate` | Gera migrações Drizzle após mudança de schema |
