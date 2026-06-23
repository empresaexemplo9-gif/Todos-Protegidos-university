-- ============================================================
-- TODOS PROTEGIDOS — Operação / CRM (integração Power CRM)
--
-- Tabelas que recebem os dados vindos do Power CRM (via Edge Function que
-- escuta os webhooks). Tudo isolado por tenant. A ESCRITA é feita pela
-- função (service role, ignora RLS); a LEITURA é liberada para admin do
-- tenant (área de Operação/CRM).
--
-- Rode no SQL Editor depois do schema.sql. Seguro rodar mais de uma vez.
-- ============================================================

-- Log bruto de TODO webhook recebido (auditoria + reprocessamento/refino do mapa)
create table if not exists public.crm_eventos (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  tipo        text,
  payload     jsonb not null default '{}'::jsonb,
  recebido_em timestamptz not null default now()
);

-- Clientes / leads
create table if not exists public.crm_clientes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  externo_id    text,
  nome          text,
  telefone      text,
  email         text,
  documento     text,
  veiculo       text,
  placa         text,
  cidade        text,
  estado        text,
  consultor     text,
  status        text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tenant_id, externo_id)
);

-- Cotações
create table if not exists public.crm_cotacoes (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  externo_id        text,
  cliente_externo_id text,
  nome              text,
  veiculo           text,
  placa             text,
  plano             text,
  valor             numeric,
  status            text,   -- nova / aceita / recusada ...
  consultor         text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  unique (tenant_id, externo_id)
);

-- Vistorias (liberadas pelo Power CRM; fotos no app Visto)
create table if not exists public.crm_vistorias (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  externo_id        text,
  cliente_externo_id text,
  nome              text,
  veiculo           text,
  placa             text,
  link_visto        text,
  codigo_visto      text,
  status            text,   -- liberada / pendente / concluida ...
  consultor         text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  unique (tenant_id, externo_id)
);

-- Contratos de adesão
create table if not exists public.crm_contratos (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  externo_id        text,
  cliente_externo_id text,
  nome              text,
  plano             text,
  valor             numeric,
  status            text,   -- gerado / enviado / assinado ...
  url               text,
  consultor         text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  unique (tenant_id, externo_id)
);

-- Índices de leitura
create index if not exists crm_clientes_tenant_idx  on public.crm_clientes  (tenant_id, criado_em desc);
create index if not exists crm_cotacoes_tenant_idx  on public.crm_cotacoes  (tenant_id, criado_em desc);
create index if not exists crm_vistorias_tenant_idx on public.crm_vistorias (tenant_id, criado_em desc);
create index if not exists crm_contratos_tenant_idx on public.crm_contratos (tenant_id, criado_em desc);

-- RLS: leitura só para admin/presidente do tenant (superadmin vê todos).
-- (A escrita é feita pela Edge Function com a service role, que ignora RLS.)
do $$
declare tb text;
begin
  foreach tb in array array['crm_eventos','crm_clientes','crm_cotacoes','crm_vistorias','crm_contratos'] loop
    execute format('alter table public.%I enable row level security;', tb);
    execute format('drop policy if exists "%s_read_admin" on public.%I;', tb, tb);
    execute format($f$create policy "%s_read_admin" on public.%I
      for select using (public.is_superadmin() or (public.is_admin() and tenant_id = public.current_tenant_id()));$f$, tb, tb);
  end loop;
end $$;
