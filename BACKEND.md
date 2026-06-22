# Backend (Supabase) — Todos Protegidos

A plataforma funciona em **dois modos**, decididos automaticamente:

- **Modo local** (padrão): enquanto `assets/js/config.js` estiver sem chaves, os dados ficam no navegador (bom para demonstração).
- **Modo nuvem (Supabase)**: ao preencher as chaves, o site passa a usar um **banco Postgres + login real**, compartilhado entre todos os usuários.

Nada no front-end precisa ser reescrito para ativar — basta configurar.

---

## Passo a passo para ativar o Supabase

### 1. Criar o projeto
1. Acesse <https://supabase.com> e crie uma conta (gratuita).
2. **New project** → escolha um nome e uma senha de banco → aguarde subir.

### 2. Criar as tabelas e regras
1. No projeto, abra **SQL Editor**.
2. Cole **todo** o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   - Cria as tabelas `tenants`, `profiles`, `modulos`, `itens`, as políticas de **isolamento por tenant** (RLS) e o **tenant inicial** (`matriz`).
   - A **trilha começa vazia** — o admin de cada tenant cria os módulos. Nenhum dado de exemplo é inserido.
   - Se já rodou um schema antigo neste projeto, rode antes o [`supabase/rollback.sql`](supabase/rollback.sql).
3. Para o **upload de videoaulas**, rode também [`supabase/storage.sql`](supabase/storage.sql).
   - Cria o bucket público `midia` (leitura pública para o vídeo tocar; envio só para admins).
   - Para vídeos grandes, ajuste o limite em **Storage → Settings → File size limit**.
4. Para o **acompanhamento de progresso** (aulas concluídas), rode [`supabase/progress.sql`](supabase/progress.sql).
   - Cria a tabela `progresso` (cada consultor vê/edita só o próprio progresso).
   - Já incluído no `schema.sql` para instalações novas; o `progress.sql` é para quem já rodou o schema antes.
5. Para as **provas por módulo** e o **título de cargo**, rode [`supabase/quiz.sql`](supabase/quiz.sql).
   - Cria a tabela `questoes` (10 questões por módulo, isoladas por tenant; só admin edita) e a coluna `profiles.titulo`.
   - **Definir o Ubirani como Presidente** (ajuste o e-mail):
     ```sql
     update public.profiles set titulo = 'Presidente da empresa'
     where id = (select id from auth.users where email = 'ubirani@SEU-DOMINIO.com');
     ```
     *(Mesmo sem rodar esse update, qualquer usuário cujo nome contenha "Ubirani" já aparece como "Presidente da empresa" na interface.)*
6. **(Opcional) Conteúdo completo da trilha** — rode [`supabase/conteudo.sql`](supabase/conteudo.sql).
   - Cria **9 módulos** (2 reservados ao Presidente + 7 de vendas) com aulas/roteiros e **10 questões por módulo** (SPIN, Challenger e Sandler aplicados à proteção veicular), no tenant `matriz`.
   - Idempotente: pula módulos que já existem. O admin pode editar tudo depois pela Gestão.
7. **Painel da equipe (admin)** — rode [`supabase/equipe.sql`](supabase/equipe.sql).
   - Cria a política que permite ao **admin enxergar o progresso dos consultores do seu tenant** (página "Progresso da equipe"). Já incluído no `schema.sql` para instalações novas.
8. **Resultados das provas** — rode [`supabase/resultados.sql`](supabase/resultados.sql).
   - Cria a tabela `resultados` (nota + aprovação por consultor/módulo) e as políticas (cada um grava o seu; admin lê a equipe). Faz o painel mostrar **provas aprovadas**. Já incluído no `schema.sql` para instalações novas.
9. **Manual do consultor** — rode [`supabase/manual.sql`](supabase/manual.sql).
   - Cria a tabela `manual` (diretrizes/orientações de atendimento). **Leitura:** todos do tenant. **Escrita (criar/editar/excluir):** só **admin/presidente**. Já vem com a “Diretriz de Atendimento aos Associados” (0800 / Setor de Eventos).
10. **(Opcional) Conteúdo aprofundado** — rode [`supabase/conteudo-aprofundado.sql`](supabase/conteudo-aprofundado.sql) **depois** do `conteudo.sql`.
    - Reordena os institucionais (**Palavra do Presidente** vira Módulo 1 e **Filosofia** Módulo 2), substitui as descrições das aulas de vendas por **material de estudo completo** (leitura aprofundada, sem depender de vídeo) e adiciona uma aula de “Leitura aprofundada” em cada módulo de vendas. Seguro rodar mais de uma vez.
11. **(Opcional) Boas práticas do mercado** — rode [`supabase/conteudo-web.sql`](supabase/conteudo-web.sql) **depois** dos anteriores.
    - Adiciona em cada módulo de vendas (3–9) uma aula **“Boas práticas do mercado (pesquisa)”**, destilada de referências consagradas de vendas e de conteúdos de proteção veicular, **com as fontes citadas**. Idempotente.

### 3. Pegar as chaves de API
1. **Project Settings → API**.
2. Copie **Project URL** e a chave **anon public**.

### 4. Configurar o front-end
Edite `assets/js/config.js`:
```js
window.TP_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA-CHAVE-ANON",
  ADMIN_EMAIL: "admin@todosprotegidos.com.br",
  ADMIN_LOCAL_SENHA: "admin2026"
};
```
Faça commit/push — o GitHub Pages publica e o backend fica ativo.

### 5. Criar o administrador (por tenant)
> Como cada usuário pertence a um tenant, o admin é criado se **cadastrando pelo site** (assim o vínculo com o tenant é feito), e depois promovido.

1. No site, abra **Criar meu acesso** e cadastre-se com:
   - E-mail: o mesmo do `ADMIN_EMAIL` (ex.: `admin@todosprotegidos.com.br`)
   - **Código da empresa/unidade:** `matriz`
2. Promova esse usuário a admin no **SQL Editor**:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'admin@todosprotegidos.com.br');
   ```
3. Na tela de login, digite **`admin`** e a senha — o sistema usa o `ADMIN_EMAIL` automaticamente.

### 6. (Recomendado) Cadastro sem e-mail de confirmação
Para uso interno, em **Authentication → Providers → Email**, desative **Confirm email**.
Assim o consultor entra direto ao se cadastrar.

### 7. Multi-tenant (isolamento de empresas/unidades)
- Cada usuário pertence a **um tenant**, definido pelo **código** digitado no cadastro (campo "Código da empresa/unidade").
- Um tenant **só enxerga** seus próprios usuários e seu próprio conteúdo — isolamento garantido por RLS.
- **Criar um novo tenant** (SQL Editor):
  ```sql
  insert into public.tenants (nome, slug) values ('Unidade SP', 'sp');
  ```
  Depois, os consultores dessa unidade se cadastram com o código `sp`, e o admin dela é promovido com o mesmo `update ... set role='admin'`.
- **Superadmin** (enxerga todos os tenants): `update public.profiles set role='superadmin' where id = (...);`

---

## O que fica no banco
| Tabela | Conteúdo |
|---|---|
| `tenants` | empresas/unidades (cada uma com um `slug`/código) |
| `profiles` | nome, telefone, **tenant** e **perfil** (`consultor`/`admin`/`superadmin`) |
| `modulos` | módulos da trilha (de cada tenant) |
| `itens` | aulas, vídeos, informações e materiais (de cada tenant) |

**Segurança (RLS) — isolamento por tenant:** cada usuário só lê os dados do **seu** tenant; só **admin** do tenant cria/edita/exclui módulos e itens. `superadmin` enxerga todos os tenants.

---

## Modelo de dados (camada `TPData`)
Todo o front fala com `window.TPData` (em `assets/js/api.js`), que expõe a mesma API nos dois modos:
`register`, `login`, `logout`, `session`, `listModules`, `addModule`, `deleteModule`, `addItem`, `deleteItem`.
Trocar de modo local → nuvem (ou vice-versa) é só preencher/esvaziar o `config.js`.
