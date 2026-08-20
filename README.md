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
- `GOOGLE_CSE_KEY` e `GOOGLE_CSE_ID` — obrigatórias para o botão **🔎 Foto**
  (buscar e importar foto real da web). São a chave da API do Google e o id do
  mecanismo de busca (Custom Search) com busca de imagens habilitada.

#### Como gerar `GOOGLE_CSE_KEY` e `GOOGLE_CSE_ID`
1. **API key (`GOOGLE_CSE_KEY`):** em <https://console.cloud.google.com/> escolha/crie um
   projeto → **APIs e serviços → Biblioteca** → ative a **Custom Search API** →
   **Credenciais → Criar credenciais → Chave de API**. Copie a chave.
2. **ID do mecanismo (`GOOGLE_CSE_ID`):** em
   <https://programmablesearchengine.google.com/controlpanel/all> → **Adicionar** →
   marque **"Pesquisar em toda a web"** e **ligue "Pesquisa de imagens"** → copie o
   **Search engine ID**.
3. **Cadastre no deploy** (mesma tela onde já está `OPENAI_API_KEY`): na Vercel em
   **Settings → Environment Variables** e na Netlify em **Site configuration →
   Environment variables**; depois refaça o deploy.

Observações: a chave da OpenAI **não** serve aqui (provedores diferentes) — a `GOOGLE_CSE_KEY`
precisa ser uma chave do Google Cloud. O plano grátis do Custom Search dá ~100 buscas/dia.
Sem essas variáveis, o botão **🔎 Foto** mostra um aviso de "não configurado" e o resto da
proposta continua funcionando.

A chave da OpenAI fica somente no servidor. Usuários autenticados podem abrir uma proposta,
entrar em **W · Editar documento**, clicar em **✦ IA**, descrever a cena e inserir a imagem
gerada diretamente no ponto do cursor.

### Levar os dados locais para a nuvem
```bash
DATABASE_URL="postgres://..." node tools/importar-dados.mjs
# ou apontando um backup: node tools/importar-dados.mjs caminho/do/backup.json
```
O script preserva os ids e pode ser repetido sem duplicar registros.
