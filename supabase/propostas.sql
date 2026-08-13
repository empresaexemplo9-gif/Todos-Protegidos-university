-- ============================================================
-- Módulo PROPOSTAS (aditivo) — Sona · Propostas
-- Rode no SQL Editor DEPOIS do schema.sql.
-- Cria SOMENTE a tabela public.propostas + RLS. Não altera nem apaga
-- nada do que já existe (tenants, profiles, usuários, conteúdo).
-- Visibilidade: cada usuário vê as SUAS propostas; admin/superadmin
-- veem as do próprio tenant (mesmas funções auxiliares do schema.sql).
-- ============================================================

create table if not exists public.propostas (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero            text default '',
  titulo            text not null default '',
  cliente_nome      text default '',
  cliente_email     text default '',
  cliente_telefone  text default '',
  cliente_documento text default '',
  status            text not null default 'rascunho'
                    check (status in ('rascunho','enviada','aceita','recusada')),
  validade          date,
  itens             jsonb   not null default '[]'::jsonb,  -- [{descricao, quantidade, valor_unitario}]
  desconto          numeric not null default 0,
  observacoes       text default '',
  condicoes         text default '',
  total             numeric not null default 0,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

-- Preenche tenant_id automaticamente ao inserir (reusa a função do schema.sql)
drop trigger if exists set_tenant_propostas on public.propostas;
create trigger set_tenant_propostas before insert on public.propostas
  for each row execute function public.set_tenant_id();

alter table public.propostas enable row level security;

-- SELECT: as próprias; admin vê as do tenant; superadmin vê todas
drop policy if exists "propostas_select" on public.propostas;
create policy "propostas_select" on public.propostas
  for select using (
    user_id = auth.uid()
    or public.is_superadmin()
    or (public.is_admin() and tenant_id = public.current_tenant_id())
  );

-- INSERT: cada um cria as suas (tenant_id é preenchido pelo trigger)
drop policy if exists "propostas_insert" on public.propostas;
create policy "propostas_insert" on public.propostas
  for insert with check (user_id = auth.uid());

-- UPDATE: dono ou admin do tenant
drop policy if exists "propostas_update" on public.propostas;
create policy "propostas_update" on public.propostas
  for update using (
    user_id = auth.uid()
    or (public.is_admin() and tenant_id = public.current_tenant_id())
  );

-- DELETE: dono ou admin do tenant
drop policy if exists "propostas_delete" on public.propostas;
create policy "propostas_delete" on public.propostas
  for delete using (
    user_id = auth.uid()
    or (public.is_admin() and tenant_id = public.current_tenant_id())
  );

-- Índices úteis
create index if not exists propostas_tenant_idx on public.propostas (tenant_id);
create index if not exists propostas_user_idx   on public.propostas (user_id);
create index if not exists propostas_status_idx on public.propostas (status);

-- ============================================================
-- Para reverter só este módulo (sem afetar o resto):
--   drop table if exists public.propostas cascade;
-- ============================================================
