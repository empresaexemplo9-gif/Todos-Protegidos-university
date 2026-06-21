-- ============================================================
-- TODOS PROTEGIDOS — Resultados das provas (nota + aprovação)
-- Rode no SQL Editor se já tinha o schema rodado antes.
-- Seguro rodar mais de uma vez.
-- ============================================================
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

drop policy if exists "resultados_admin_select" on public.resultados;
create policy "resultados_admin_select" on public.resultados
  for select using (
    public.is_admin() and exists (
      select 1 from public.profiles p
      where p.id = resultados.user_id and p.tenant_id = public.current_tenant_id()
    )
  );
