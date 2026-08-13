# Sona · Propostas

Plataforma de **propostas comerciais** em **HTML/CSS/JS puro** com backend
**Supabase** (Postgres + login real), sobre uma base **multi-tenant**
(isolamento por empresa/unidade via RLS).

Fluxo da proposta: **rascunho → enviada → aceita / recusada**. Cada proposta
tem cabeçalho do cliente, **itens** (descrição, quantidade, valor unitário) com
**total calculado**, desconto, validade, observações e condições — além de uma
**visualização limpa e imprimível** (Salvar em PDF) para enviar ao cliente.

## 📄 Páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing da Sona |
| `login.html` · `cadastro.html` | Acesso (cadastro por código de empresa/unidade) |
| `propostas.html` | Lista de propostas (filtro por status + resumo) |
| `proposta.html` | Criar / editar proposta (`?id=novo` ou `?id=<uuid>`) |
| `proposta-view.html` | Visualizar / imprimir proposta (`?id=<uuid>`) |
| `dashboard.html` | Visão geral (resumo e propostas recentes) |
| `conta.html` | Minha conta |
| `gestao.html` | Gestão de conteúdo (admin) — herdado da base |
| `styleguide.html` | Design System |

## 🚀 Como visualizar

Não há build. Abra `index.html` no navegador ou sirva a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Sem Supabase configurado, roda em **modo local** (dados no navegador) — ótimo
para testar o fluxo de propostas de ponta a ponta.

## ☁️ Backend (Supabase)

1. No **SQL Editor** do seu projeto, rode nesta ordem:
   - `supabase/schema.sql` — base multi-tenant (tenants, profiles, RLS).
   - `supabase/storage.sql` — bucket de arquivos (opcional).
   - `supabase/propostas.sql` — **tabela `propostas` + RLS** (o módulo).
2. Em `assets/js/config.js`, preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
   `ADMIN_EMAIL`.
3. Cadastre-se pelo site com o **código do tenant** e promova sua conta a
   admin/superadmin (veja o rodapé do `schema.sql`).

**Visibilidade (RLS):** cada usuário vê as **suas** propostas; **admin/superadmin**
veem as do próprio tenant.

> ⚠️ `supabase/propostas.sql` é **aditivo** — cria apenas a tabela `propostas`,
> sem tocar em usuários, acessos ou dados existentes.
>
> ⚠️ **Não** rode `supabase/limpeza.sql` a menos que queira apagar conteúdo e
> acessos — ele existe só como utilitário de reset e não é necessário para a Sona.

## 📁 Estrutura

```
.
├── index.html · login.html · cadastro.html
├── propostas.html · proposta.html · proposta-view.html
├── dashboard.html · conta.html · gestao.html · styleguide.html
├── assets/
│   ├── css/  (tokens.css, main.css, dashboard.css, internal.css)
│   ├── js/   (config.js, api.js, components.js, app.js)
│   └── img/  (logo.svg, logo-light.svg, logo-mark.svg, favicon.svg, icon.svg)
└── supabase/ (schema.sql, storage.sql, propostas.sql, rollback.sql, limpeza.sql)
```

## 🎨 Marca & Design System

- **Marca Sona:** `logo.svg` (fundo claro), `logo-light.svg` (fundo escuro),
  `logo-mark.svg` (símbolo), `favicon.svg`, `icon.svg`.
- **Tokens:** `assets/css/tokens.css` — cores, tipografia, espaçamento.
- **Tipografia:** Poppins (títulos) · Inter (texto).
