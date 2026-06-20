-- ============================================================
-- TODOS PROTEGIDOS — Reverter o schema (rollback) — versão multi-tenant
-- Remove tudo que supabase/schema.sql criou neste projeto.
-- NÃO afeta os usuários do Authentication (auth.users).
-- Rode no SQL Editor do projeto onde deseja desfazer.
-- ============================================================

-- 1) Triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists set_tenant_modulos on public.modulos;
drop trigger if exists set_tenant_itens   on public.itens;

-- 2) Funções
drop function if exists public.handle_new_user()   cascade;
drop function if exists public.set_tenant_id()     cascade;
drop function if exists public.is_admin()          cascade;
drop function if exists public.is_superadmin()     cascade;
drop function if exists public.current_tenant_id() cascade;
drop function if exists public.tenant_existe(text) cascade;

-- 3) Tabelas (CASCADE remove também políticas RLS, FKs e o seed)
drop table if exists public.progresso cascade;
drop table if exists public.itens   cascade;
drop table if exists public.modulos cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants  cascade;
