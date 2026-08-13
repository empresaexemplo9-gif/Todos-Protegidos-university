-- ============================================================
-- LIMPEZA GERAL DO BANCO (reset para começar um novo projeto)
-- ------------------------------------------------------------
-- Apaga TODO o conteúdo e TODOS os acessos, mantendo apenas UM
-- usuário. Recria um tenant limpo e torna esse usuário superadmin.
--
-- ⚠️  IRREVERSÍVEL. Faça backup antes se precisar.
-- ⚠️  Rode no Supabase: Dashboard > SQL Editor (roda como service role;
--     o site, com a chave anon, NÃO consegue apagar usuários — por isso
--     esta limpeza é feita aqui, uma única vez).
--
-- Pré-requisito: o schema já criado (supabase/schema.sql).
-- Ajuste o e-mail abaixo se quiser manter outra conta.
-- ============================================================

-- E-mail do ÚNICO acesso a manter:
--   thiagohccarvalho00@gmail.com

-- 0) TRAVA DE SEGURANÇA — se o e-mail a manter não existir em auth.users,
--    aborta tudo (evita apagar 100% dos usuários por engano).
do $$
declare v_id uuid;
begin
  select id into v_id from auth.users
   where lower(email) = lower('thiagohccarvalho00@gmail.com');
  if v_id is null then
    raise exception 'E-mail a manter nao encontrado em auth.users. Abortado para nao apagar todos os usuarios.';
  end if;
end $$;

-- 1) Apaga todo o CONTEÚDO (módulos, itens, provas, progresso, resultados).
truncate table public.resultados, public.progresso, public.questoes,
               public.itens, public.modulos restart identity cascade;

-- 2) Apaga arquivos enviados (vídeos/materiais) do bucket "midia".
delete from storage.objects where bucket_id = 'midia';

-- 3) Apaga TODOS os usuários do Authentication, EXCETO o e-mail a manter.
--    (remove em cascata os profiles/progresso/resultados dos demais)
delete from auth.users
 where lower(email) <> lower('thiagohccarvalho00@gmail.com');

-- 4) Cria o tenant limpo (se ainda não existir).
insert into public.tenants (nome, slug) values ('Minha Empresa', 'minhaempresa')
on conflict (slug) do nothing;

-- 5) Vincula o usuário mantido ao tenant limpo e o torna SUPERADMIN.
insert into public.profiles (id, tenant_id, nome, role)
select u.id, t.id, coalesce(u.raw_user_meta_data->>'nome', ''), 'superadmin'
from auth.users u
cross join (select id from public.tenants where slug = 'minhaempresa') t
where lower(u.email) = lower('thiagohccarvalho00@gmail.com')
on conflict (id) do update
  set tenant_id = excluded.tenant_id, role = 'superadmin';

-- 6) Remove qualquer outro tenant (mantém só o limpo).
delete from public.tenants where slug <> 'minhaempresa';

-- ============================================================
-- Depois de rodar:
--   • Só resta o acesso thiagohccarvalho00@gmail.com (superadmin).
--   • O tenant é "minhaempresa" (código usado no cadastro).
--   • Todo o conteúdo antigo foi removido — a plataforma está limpa.
-- ============================================================
