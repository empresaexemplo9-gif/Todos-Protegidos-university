-- ============================================================
-- TODOS PROTEGIDOS — Definir o CÓDIGO da empresa (tenant)
-- ------------------------------------------------------------
-- Renomeia o tenant inicial "matriz" para o código real da empresa
-- ("todosprotegidos"), que é o que os consultores digitam no cadastro.
--
-- SEGURO: renomeia a MESMA linha (o tenant_id não muda), então todos os
-- acessos, módulos, aulas, provas e conteúdos já criados continuam
-- vinculados normalmente. Ninguém perde nada e ninguém precisa recadastrar.
--
-- Onde rodar: painel do Supabase → SQL Editor → cole e clique em "Run".
-- ============================================================

update public.tenants
   set slug = 'todosprotegidos',
       nome = 'Todos Protegidos'
 where slug = 'matriz';

-- Confirmação: deve listar o tenant já com o código novo.
select id, nome, slug, created_at from public.tenants order by created_at;

-- ------------------------------------------------------------
-- (Opcional) Cadastrar CÓDIGOS de unidades adicionais.
-- Depois, os consultores dessa unidade se cadastram com esse código.
-- Descomente e ajuste conforme precisar:
--
--   insert into public.tenants (nome, slug) values ('Unidade São Paulo', 'sp');
--   insert into public.tenants (nome, slug) values ('Unidade Rio',       'rj');
-- ============================================================
