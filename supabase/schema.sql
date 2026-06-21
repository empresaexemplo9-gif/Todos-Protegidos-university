-- ============================================================
-- TODOS PROTEGIDOS — Backend MULTI-TENANT (Supabase / PostgreSQL)
-- Isolamento por TENANT (empresa/unidade): cada tenant só enxerga
-- os próprios usuários e o próprio conteúdo (garantido por RLS).
-- Rode UMA VEZ no SQL Editor do projeto certo.
-- (Se já rodou o schema antigo neste projeto, rode antes o rollback.sql.)
-- ============================================================

-- 1) TENANTS (empresas / unidades)
create table if not exists public.tenants (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  slug       text not null unique,        -- "código" usado no cadastro
  created_at timestamptz not null default now()
);

-- 2) PERFIS (1:1 com auth.users) — cada perfil pertence a um tenant
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid references public.tenants(id) on delete cascade,
  nome       text,
  telefone   text,
  role       text not null default 'consultor' check (role in ('consultor','admin','superadmin')),
  created_at timestamptz not null default now()
);

-- 3) MÓDULOS (por tenant)
create table if not exists public.modulos (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  titulo     text not null,
  subtitulo  text default '',
  ordem      bigint not null default 0,
  created_at timestamptz not null default now()
);

-- 4) ITENS (aulas, vídeos, informações, materiais — por tenant)
create table if not exists public.itens (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  modulo_id  uuid not null references public.modulos(id) on delete cascade,
  tipo       text not null default 'aula' check (tipo in ('aula','video','info','file')),
  titulo     text not null,
  meta       text default '',
  url        text default '',
  descricao  text default '',
  ordem      bigint not null default 0,
  created_at timestamptz not null default now()
);

-- 5) Funções utilitárias (security definer: leem profiles sem recursão de RLS)
create or replace function public.current_tenant_id()
returns uuid language sql security definer stable as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','superadmin'));
$$;

create or replace function public.is_superadmin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'superadmin');
$$;

-- Valida o código do tenant ANTES do cadastro (chamável pelo navegador)
create or replace function public.tenant_existe(p_slug text)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.tenants where slug = lower(trim(p_slug)));
$$;
grant execute on function public.tenant_existe(text) to anon, authenticated;

-- 6) Ao registrar um usuário, cria o perfil e vincula ao tenant pelo "código" (slug)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare t uuid;
begin
  select id into t from public.tenants
   where slug = lower(trim(coalesce(new.raw_user_meta_data->>'tenant','')));
  insert into public.profiles (id, tenant_id, nome, telefone)
  values (
    new.id, t,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'telefone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7) Preenche tenant_id automaticamente ao inserir módulos/itens (a partir do usuário)
create or replace function public.set_tenant_id()
returns trigger language plpgsql security definer as $$
begin
  if new.tenant_id is null then new.tenant_id := public.current_tenant_id(); end if;
  return new;
end;
$$;

drop trigger if exists set_tenant_modulos on public.modulos;
create trigger set_tenant_modulos before insert on public.modulos
  for each row execute function public.set_tenant_id();

drop trigger if exists set_tenant_itens on public.itens;
create trigger set_tenant_itens before insert on public.itens
  for each row execute function public.set_tenant_id();

-- 8) Row Level Security (isolamento por tenant)
alter table public.tenants  enable row level security;
alter table public.profiles enable row level security;
alter table public.modulos  enable row level security;
alter table public.itens    enable row level security;

-- tenants: vê só o próprio (superadmin vê todos)
drop policy if exists "tenants_select" on public.tenants;
create policy "tenants_select" on public.tenants
  for select using (id = public.current_tenant_id() or public.is_superadmin());

-- profiles: vê o próprio; admin vê os do seu tenant; superadmin vê todos
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_superadmin()
    or (public.is_admin() and tenant_id = public.current_tenant_id())
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin() and tenant_id = public.current_tenant_id());

-- modulos: leitura só do próprio tenant; escrita só admin do tenant
drop policy if exists "modulos_read" on public.modulos;
create policy "modulos_read" on public.modulos
  for select using (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop policy if exists "modulos_write" on public.modulos;
create policy "modulos_write" on public.modulos
  for all using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

-- itens: idem
drop policy if exists "itens_read" on public.itens;
create policy "itens_read" on public.itens
  for select using (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop policy if exists "itens_write" on public.itens;
create policy "itens_write" on public.itens
  for all using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

-- 8.1) PROGRESSO do consultor (aulas concluídas) — cada um vê/edita só o seu
create table if not exists public.progresso (
  user_id      uuid not null references auth.users(id) on delete cascade,
  item_id      uuid not null references public.itens(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.progresso enable row level security;

drop policy if exists "progresso_select_own" on public.progresso;
create policy "progresso_select_own" on public.progresso
  for select using (user_id = auth.uid());

drop policy if exists "progresso_insert_own" on public.progresso;
create policy "progresso_insert_own" on public.progresso
  for insert with check (user_id = auth.uid());

drop policy if exists "progresso_delete_own" on public.progresso;
create policy "progresso_delete_own" on public.progresso
  for delete using (user_id = auth.uid());

-- admin enxerga o progresso dos usuários do seu tenant (painel da equipe)
drop policy if exists "progresso_admin_select" on public.progresso;
create policy "progresso_admin_select" on public.progresso
  for select using (
    public.is_admin() and exists (
      select 1 from public.profiles p
      where p.id = progresso.user_id and p.tenant_id = public.current_tenant_id()
    )
  );

-- 8.2) TÍTULO/CARGO do perfil (ex.: "Presidente da empresa")
alter table public.profiles add column if not exists titulo text;

-- 8.3) QUESTÕES da prova (por módulo / tenant) — leitura no tenant, escrita só admin
create table if not exists public.questoes (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  modulo_id  uuid not null references public.modulos(id) on delete cascade,
  ordem      bigint not null default 0,
  enunciado  text not null,
  opcoes     jsonb not null default '[]'::jsonb,
  correta    int  not null default 0,
  created_at timestamptz not null default now()
);
alter table public.questoes enable row level security;

drop trigger if exists set_tenant_questoes on public.questoes;
create trigger set_tenant_questoes before insert on public.questoes
  for each row execute function public.set_tenant_id();

drop policy if exists "questoes_read" on public.questoes;
create policy "questoes_read" on public.questoes
  for select using (tenant_id = public.current_tenant_id() or public.is_superadmin());

drop policy if exists "questoes_write" on public.questoes;
create policy "questoes_write" on public.questoes
  for all using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

-- 8.4) RESULTADOS das provas (nota + aprovação por consultor/módulo)
create table if not exists public.resultados (
  user_id   uuid not null references auth.users(id) on delete cascade,
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  nota      int not null default 0,
  aprovado  boolean not null default false,
  feito_em  timestamptz not null default now(),
  primary key (user_id, modulo_id)
);
alter table public.resultados enable row level security;

drop policy if exists "resultados_select_own" on public.resultados;
create policy "resultados_select_own" on public.resultados
  for select using (user_id = auth.uid());

drop policy if exists "resultados_insert_own" on public.resultados;
create policy "resultados_insert_own" on public.resultados
  for insert with check (user_id = auth.uid());

drop policy if exists "resultados_update_own" on public.resultados;
create policy "resultados_update_own" on public.resultados
  for update using (user_id = auth.uid());

-- admin vê os resultados da equipe do seu tenant (painel)
drop policy if exists "resultados_admin_select" on public.resultados;
create policy "resultados_admin_select" on public.resultados
  for select using (
    public.is_admin() and exists (
      select 1 from public.profiles p
      where p.id = resultados.user_id and p.tenant_id = public.current_tenant_id()
    )
  );

-- 9) Tenant inicial (necessário para os primeiros cadastros).
--    A trilha começa VAZIA — o admin de cada tenant cria os módulos.
insert into public.tenants (nome, slug)
select 'Matriz', 'matriz'
where not exists (select 1 from public.tenants);

-- ============================================================
-- COMO CRIAR UM ADMIN (por tenant)
-- 1) Cadastre-se pelo site usando o CÓDIGO do tenant (ex.: "matriz").
-- 2) Promova o usuário a admin:
--      update public.profiles set role = 'admin'
--      where id = (select id from auth.users where email = 'admin@todosprotegidos.com.br');
--
-- COMO CRIAR OUTRO TENANT (empresa/unidade):
--      insert into public.tenants (nome, slug) values ('Unidade SP', 'sp');
--   (depois os consultores dessa unidade se cadastram com o código "sp")
--
-- SUPERADMIN (enxerga todos os tenants):
--      update public.profiles set role = 'superadmin' where id = (...);
-- ============================================================
