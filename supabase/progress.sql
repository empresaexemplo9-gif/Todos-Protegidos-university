-- ============================================================
-- TODOS PROTEGIDOS — Acompanhamento de progresso (aulas concluídas)
-- Rode no SQL Editor se você JÁ tinha rodado o schema.sql antigo
-- (sem a tabela de progresso). É seguro rodar mais de uma vez.
-- ============================================================

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
