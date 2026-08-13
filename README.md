# Plataforma multi-tenant — base limpa

Base de plataforma **multi-tenant** em **HTML/CSS/JS puro** com backend
**Supabase** (Postgres + login real). Sem nome, sem logo e sem dados de
terceiros — um ponto de partida genérico para construir o seu projeto.

O que já vem pronto:

- **Multi-tenant** com isolamento por empresa/unidade (RLS no banco).
- **Cadastro** (por código de empresa), **login** e **conta** do usuário.
- **Painel** (dashboard) e **Gestão de conteúdo** (área do admin).
- **Design system** (tokens de cor/tipografia) e **PWA** (instalável/offline).

> Marca e identidade estão como **placeholder** ("Sua Marca"). Troque os
> arquivos em `assets/img/` (`logo.svg`, `logo-mark.svg`, `favicon.svg`,
> `icon.svg`) e os textos das páginas pela sua marca.

## 📄 Páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing genérica (apresentação + acesso) |
| `login.html` | Login |
| `cadastro.html` | Criar acesso (com código de empresa/unidade) |
| `dashboard.html` | Painel do usuário (base limpa) |
| `gestao.html` | Gestão de conteúdo — módulos e itens (admin) |
| `conta.html` | Minha conta (editar dados e senha) |
| `styleguide.html` | Guia de estilo / design system |

## 🚀 Como visualizar

Não há build — HTML/CSS/JS puro. Abra `index.html` no navegador ou sirva a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Sem configurar o Supabase, a plataforma roda em **modo local** (dados no
navegador), útil para demonstração.

## ☁️ Backend (Supabase)

1. Crie um projeto no Supabase e rode, no **SQL Editor**:
   - `supabase/schema.sql` — tabelas multi-tenant + RLS + tenant inicial.
   - `supabase/storage.sql` — bucket `midia` para vídeos/materiais.
2. Em `assets/js/config.js`, preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
   `ADMIN_EMAIL`.
3. Cadastre-se pelo site usando o **código do tenant** (padrão: `minhaempresa`)
   e promova sua conta a admin/superadmin (veja o rodapé do `schema.sql`).

Utilitários SQL:

- `supabase/rollback.sql` — desfaz o schema (não afeta usuários do Auth).
- `supabase/limpeza.sql` — **reset geral**: apaga todo o conteúdo e todos os
  acessos, mantendo apenas **um** usuário (ajustável no arquivo), e recria um
  tenant limpo. Rode no SQL Editor do Supabase (a chave anon do site não
  consegue apagar usuários).

## 📁 Estrutura

```
.
├── index.html · login.html · cadastro.html
├── dashboard.html · gestao.html · conta.html · styleguide.html
├── assets/
│   ├── css/  (tokens.css, main.css, dashboard.css, internal.css)
│   ├── js/   (config.js, api.js, components.js, app.js)
│   └── img/  (logo.svg, logo-mark.svg, favicon.svg, icon.svg)
└── supabase/ (schema.sql, storage.sql, rollback.sql, limpeza.sql)
```

## 🎨 Design System

- **Tokens:** `assets/css/tokens.css` — cores, tipografia, espaçamento, sombras.
- **Base + componentes:** `assets/css/main.css`, `dashboard.css`, `internal.css`.
- **Tipografia:** Poppins (títulos) · Inter (texto).
