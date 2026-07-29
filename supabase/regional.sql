-- ============================================================
-- TODOS PROTEGIDOS — PAINEL REGIONAL (filiais)
-- ------------------------------------------------------------
-- Indicadores por filial + a fonte de dados (planilha do Google Drive).
--
-- PERMISSÕES (regra da empresa):
--   • SOMENTE ADMINISTRADOR (admin/superadmin) pode VER, EDITAR, ALTERAR
--     e VINCULAR as planilhas. Consultor não enxerga nada desta área.
--
-- Onde rodar: painel do Supabase -> SQL Editor -> colar -> "Run".
-- ============================================================

-- 1) Indicadores por filial
create table if not exists public.filiais (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references public.tenants(id) on delete cascade,
  nome           text not null,
  cidade         text default '',
  uf             text default '',
  ordem          bigint not null default 0,

  -- Produção
  veiculos       integer not null default 0,
  meta_veiculos  integer not null default 0,
  receita        numeric not null default 0,
  meta_receita   numeric not null default 0,
  crescimento    numeric not null default 0,

  -- Funil
  contatos       integer not null default 0,
  propostas      integer not null default 0,
  vendas         integer not null default 0,
  cancelamentos  integer not null default 0,
  inadimplencia  numeric not null default 0,

  -- Equipe
  vendedores_ativos  integer not null default 0,
  vendedores_meta    integer not null default 0,
  entrevistas        integer not null default 0,
  contratacoes       integer not null default 0,
  retencao           numeric not null default 0,

  -- TP University
  trilha_pct     numeric not null default 0,
  certificados_pct numeric not null default 0,
  premiacoes     integer not null default 0,
  meta_individual_pct numeric not null default 0,
  destaque_nome  text default '',
  destaque_vendas_semana integer not null default 0,
  destaque_meta_pct numeric not null default 0,

  atualizado_em  timestamptz not null default now(),
  unique (tenant_id, nome)
);

create index if not exists filiais_tenant_idx on public.filiais (tenant_id, ordem);

-- 2) Planilhas vinculadas (Google Drive) — só o admin cadastra
create table if not exists public.filiais_fontes (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references public.tenants(id) on delete cascade,
  nome           text not null default 'Planilha de filiais',
  url            text not null,              -- link CSV publicado do Google Sheets
  url_historico  text default '',            -- 2ª planilha: evolução mensal
  ultima_sync    timestamptz,
  linhas         integer default 0,
  criado_em      timestamptz not null default now()
);

-- Para bancos criados antes desta coluna existir
alter table public.filiais_fontes add column if not exists url_historico text default '';

-- 2b) Histórico mensal de receita (alimenta o gráfico de evolução)
create table if not exists public.filiais_historico (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references public.tenants(id) on delete cascade,
  mes        text not null,                  -- ex.: "Fev" ou "2026-02"
  ordem      integer not null default 0,
  uf         text not null default '',
  receita    numeric not null default 0,
  unique (tenant_id, mes, uf)
);

-- Preenche o tenant automaticamente
create or replace function public.set_tenant_filiais()
returns trigger language plpgsql security definer as $$
begin
  if new.tenant_id is null then new.tenant_id := public.current_tenant_id(); end if;
  return new;
end;
$$;

drop trigger if exists set_tenant_filiais_trg on public.filiais;
create trigger set_tenant_filiais_trg before insert on public.filiais
  for each row execute function public.set_tenant_filiais();

drop trigger if exists set_tenant_fontes_trg on public.filiais_fontes;
create trigger set_tenant_fontes_trg before insert on public.filiais_fontes
  for each row execute function public.set_tenant_filiais();

drop trigger if exists set_tenant_hist_trg on public.filiais_historico;
create trigger set_tenant_hist_trg before insert on public.filiais_historico
  for each row execute function public.set_tenant_filiais();

alter table public.filiais enable row level security;
alter table public.filiais_fontes enable row level security;
alter table public.filiais_historico enable row level security;

-- ============================================================
-- RLS: APENAS ADMINISTRADOR. Consultor não lê nem escreve.
-- ============================================================
drop policy if exists "filiais_admin_all" on public.filiais;
create policy "filiais_admin_all" on public.filiais
  for all
  using ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin())
  with check ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin());

drop policy if exists "fontes_admin_all" on public.filiais_fontes;
create policy "fontes_admin_all" on public.filiais_fontes
  for all
  using ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin())
  with check ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin());

drop policy if exists "hist_admin_all" on public.filiais_historico;
create policy "hist_admin_all" on public.filiais_historico
  for all
  using ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin())
  with check ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin());
