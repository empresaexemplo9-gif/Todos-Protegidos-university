-- ============================================================
-- TODOS PROTEGIDOS — ROTINA DIÁRIA do consultor
-- ------------------------------------------------------------
-- Guarda o cumprimento das tarefas do dia (follow-up, indicadores,
-- abordagem/atendimento e os treinos dos períodos ociosos).
--
-- PERMISSÕES:
--   • Consultor  -> vê e edita SOMENTE a própria rotina.
--   • Admin      -> vê a rotina de TODOS os consultores do seu tenant.
--   • Superadmin -> vê tudo.
--
-- Onde rodar: painel do Supabase -> SQL Editor -> colar -> "Run".
-- ============================================================

create table if not exists public.rotina (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tenant_id  uuid references public.tenants(id) on delete cascade,
  dia        date not null default current_date,
  tarefa_id  text not null,              -- ex.: "0900-followup"
  feito      boolean not null default true,
  obs        text default '',
  criado_em  timestamptz not null default now(),
  unique (user_id, dia, tarefa_id)
);

create index if not exists rotina_user_dia_idx on public.rotina (user_id, dia);
create index if not exists rotina_tenant_dia_idx on public.rotina (tenant_id, dia);

-- Preenche o tenant automaticamente a partir do perfil de quem inseriu
create or replace function public.set_tenant_rotina()
returns trigger language plpgsql security definer as $$
begin
  if new.tenant_id is null then new.tenant_id := public.current_tenant_id(); end if;
  return new;
end;
$$;

drop trigger if exists set_tenant_rotina_trg on public.rotina;
create trigger set_tenant_rotina_trg before insert on public.rotina
  for each row execute function public.set_tenant_rotina();

alter table public.rotina enable row level security;

-- Consultor: lê a própria rotina. Admin: lê a do seu tenant. Superadmin: tudo.
drop policy if exists "rotina_select" on public.rotina;
create policy "rotina_select" on public.rotina
  for select using (
    user_id = auth.uid()
    or (public.is_admin() and tenant_id = public.current_tenant_id())
    or public.is_superadmin()
  );

-- Escrita: cada um grava/edita/apaga SOMENTE a própria rotina
drop policy if exists "rotina_insert_own" on public.rotina;
create policy "rotina_insert_own" on public.rotina
  for insert with check (user_id = auth.uid());

drop policy if exists "rotina_update_own" on public.rotina;
create policy "rotina_update_own" on public.rotina
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "rotina_delete_own" on public.rotina;
create policy "rotina_delete_own" on public.rotina
  for delete using (user_id = auth.uid());
