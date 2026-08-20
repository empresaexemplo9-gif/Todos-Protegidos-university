# Sona Propostas — plataforma interna

Sistema interno da **Sona Automação** para criar **propostas comerciais**, o **escopo técnico**
(planta com marcadores, paredes, zoom/pan, calibração de escala e simulador de cobertura
Wi‑Fi Ubiquiti) e o **orçamento** com catálogo (SmartLife / VETRA / SCENARIO). Roda localmente
neste computador, com login próprio e acesso restrito.

## Como usar
1. Duplo clique em **`Iniciar.cmd`** (ou no atalho **“Sona Propostas”** na Área de Trabalho).
2. Abre em **http://localhost:4317**. No primeiro acesso, cadastre o administrador
   com seu próprio e-mail e uma senha segura.
3. No celular/iPhone: acesse `http://<ip-do-computador>:4317` na mesma rede e use
   *Adicionar à Tela de Início* (PWA).

## Estrutura
- `index.html`, `src/` — app React (Vite). `App.tsx` (login + navegação), `AccessManager.tsx`
  (acessos), `AvaIntegration.tsx` (conector do AVA), `LoginScreen.tsx`, `theme.css`.
- `app/` — telas grandes: `admin-workspace.tsx` (propostas + escopo técnico),
  `budget-workspace.tsx` (orçamento), `catalog-import.tsx` (importar catálogo por arquivo),
  `proposta/page.tsx` (proposta pública + aceite do cliente), `globals.css`.
- `server/` — servidor Node **sem dependências externas** (uso local): `index.mjs` (APIs +
  serve o `dist/`), `store.mjs` (dados em `data/sona-data.json`), `auth.mjs` (login por
  sessão assinada), `catalog-seed.mjs` (catálogo inicial).
- `api/` — as mesmas APIs como **funções serverless da Vercel** (versão publicada).
- `lib/` — banco (Postgres), autenticação e consultas usados pelas funções da Vercel.
- `shared/` — código comum aos dois back-ends: validadores e o conector do AVA.
- `public/` — ícones, `manifest.webmanifest`, `sw.js` e fontes (PWA instalável).
- `data/` — banco local em arquivo + `secret.key` da sessão (**fora do git**).

## Scripts
- `npm run build` — gera o `dist/`.
- `npm run server` — sobe o servidor local (serve `dist/` + `/api`).
- `npm run iniciar` — build + servidor (o que o `Iniciar.cmd` faz).
- `npm run dev` — Vite em modo desenvolvimento (proxy `/api` → `:4317`).

> Requisito: Node.js 20+ (já instalado em `%LOCALAPPDATA%\Programs\node-v22...`).

## Versão publicada (Vercel + Postgres)

O mesmo app roda na nuvem: o front é o `dist/` estático e as APIs são funções serverless
em `api/`, com os dados em um **Postgres gerenciado (Neon)** no lugar do arquivo JSON.

- Rotas: `api/auth/{session,login,setup,logout}.js`, `api/users.js`, `api/proposals.js`,
  `api/budget.js`, `api/integracao/ava.js` — mesmos caminhos e mesmo contrato do local.
- Tabelas (`sona_users`, `sona_catalog_items`, `sona_budgets`, `sona_budget_items`,
  `sona_proposals`, `sona_meta`) são criadas sozinhas na primeira chamada.
- No primeiro acesso na nuvem, a tela solicita a criação do administrador. O projeto
  não distribui uma senha padrão compartilhada.

### Variáveis de ambiente
- `DATABASE_URL` (ou `POSTGRES_URL`) — obrigatória; vem da integração Neon da Vercel.
- `SESSION_SECRET` — opcional. Sem ela, um segredo é gerado e guardado no banco;
  definindo-a, as sessões continuam válidas mesmo se o banco for recriado.
- `OPENAI_API_KEY` — obrigatória para o botão **✦ IA** do editor gerar imagens.
- `OPENAI_IMAGE_MODEL` — opcional; usa `gpt-image-1` por padrão.

A chave da OpenAI fica somente no servidor. Usuários autenticados podem abrir uma proposta,
entrar em **W · Editar documento**, clicar em **✦ IA**, descrever a cena e inserir a imagem
gerada diretamente no ponto do cursor.

### Levar os dados locais para a nuvem
```bash
DATABASE_URL="postgres://..." node tools/importar-dados.mjs
# ou apontando um backup: node tools/importar-dados.mjs caminho/do/backup.json
```
O script preserva os ids e pode ser repetido sem duplicar registros.
