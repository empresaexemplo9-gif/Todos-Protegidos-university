-- ============================================================
-- TODOS PROTEGIDOS — Financeiro (livro caixa)
-- ------------------------------------------------------------
-- Rode este arquivo no SQL Editor do Supabase.
-- Depende de schema.sql (tenants, is_admin, current_tenant_id).
--
-- ACESSO: apenas administrador. Consultor não lê nem escreve — o RLS
-- bloqueia no banco, então forçar a URL da página não expõe nada.
-- ============================================================

-- 1) Lançamentos do livro caixa
create table if not exists public.financeiro_lancamentos (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references public.tenants(id) on delete cascade,
  data          date,
  descricao     text not null default '',
  tipo          text not null default 'despesa',   -- 'receita' | 'despesa'
  valor         numeric not null default 0,        -- sempre positivo; o sinal vem do tipo
  categoria     text not null default '',
  subcategoria  text not null default '',
  responsavel   text not null default '',
  centro_custo  text not null default '',
  contraparte   text not null default '',
  status        text not null default '',          -- 'Pago' | 'Em aberto'
  pago_em       date,
  observacoes   text not null default '',
  criado_em     timestamptz not null default now()
);

create index if not exists financeiro_tenant_idx on public.financeiro_lancamentos (tenant_id, data desc);

-- 2) Planilha vinculada (Google Drive)
create table if not exists public.financeiro_fontes (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references public.tenants(id) on delete cascade,
  nome         text not null default 'Livro caixa',
  url          text not null default '',
  ultima_sync  timestamptz,
  linhas       integer default 0,
  criado_em    timestamptz not null default now()
);

-- Preenche o tenant automaticamente
create or replace function public.set_tenant_financeiro()
returns trigger language plpgsql security definer as $$
begin
  if new.tenant_id is null then new.tenant_id := public.current_tenant_id(); end if;
  return new;
end;
$$;

drop trigger if exists set_tenant_fin_lanc_trg on public.financeiro_lancamentos;
create trigger set_tenant_fin_lanc_trg before insert on public.financeiro_lancamentos
  for each row execute function public.set_tenant_financeiro();

drop trigger if exists set_tenant_fin_fontes_trg on public.financeiro_fontes;
create trigger set_tenant_fin_fontes_trg before insert on public.financeiro_fontes
  for each row execute function public.set_tenant_financeiro();

alter table public.financeiro_lancamentos enable row level security;
alter table public.financeiro_fontes enable row level security;

-- ============================================================
-- RLS: APENAS ADMINISTRADOR.
-- ============================================================
drop policy if exists "fin_lanc_admin_all" on public.financeiro_lancamentos;
create policy "fin_lanc_admin_all" on public.financeiro_lancamentos
  for all
  using ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin())
  with check ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin());

drop policy if exists "fin_fontes_admin_all" on public.financeiro_fontes;
create policy "fin_fontes_admin_all" on public.financeiro_fontes
  for all
  using ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin())
  with check ((public.is_admin() and tenant_id = public.current_tenant_id()) or public.is_superadmin());
