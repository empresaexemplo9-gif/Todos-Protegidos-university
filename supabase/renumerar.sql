-- ============================================================
-- TODOS PROTEGIDOS — Renumerar módulos de vendas (3–9 → 1–7)
--
-- Depois que os módulos institucionais saíram da trilha (institucional.sql),
-- a trilha de vendas passa a começar em 1. Este script renumera:
--   Módulo 3 -> 1, 4 -> 2, 5 -> 3, 6 -> 4, 7 -> 5, 8 -> 6, 9 -> 7
-- Ajusta: título do módulo, ordem, títulos das aulas/apostilas e os
-- cabeçalhos internos ("MÓDULO N", "Apostila N", "Aula N.x") de cada módulo.
--
-- Rode DEPOIS de institucional.sql. Seguro rodar mais de uma vez
-- (após a 1ª execução os títulos antigos não existem mais → no-op).
--
-- ATENÇÃO: após renumerar, NÃO rode de novo os scripts antigos de conteúdo
-- (conteudo.sql / conteudo-aprofundado.sql / apostila.sql), pois eles
-- procuram os módulos pelos títulos antigos ("Módulo 3 · ...").
-- ============================================================
do $$
declare
  t uuid;
  m uuid;
  -- mapeamento: array de [titulo_antigo, titulo_novo, nº_antigo, nº_novo, ordem_nova]
  pares text[][] := array[
    ['Módulo 3 · Fundamentos da Proteção Veicular',        'Módulo 1 · Fundamentos da Proteção Veicular',        '3','1','1'],
    ['Módulo 4 · Mentalidade e Rotina de Alta Performance','Módulo 2 · Mentalidade e Rotina de Alta Performance','4','2','2'],
    ['Módulo 5 · Prospecção e Abordagem',                  'Módulo 3 · Prospecção e Abordagem',                  '5','3','3'],
    ['Módulo 6 · Diagnóstico com SPIN Selling',            'Módulo 4 · Diagnóstico com SPIN Selling',            '6','4','4'],
    ['Módulo 7 · Apresentação de Valor (Challenger)',      'Módulo 5 · Apresentação de Valor (Challenger)',      '7','5','5'],
    ['Módulo 8 · Fechamento e Tratamento de Objeções',     'Módulo 6 · Fechamento e Tratamento de Objeções',     '8','6','6'],
    ['Módulo 9 · Vistoria, Pós-venda e Retenção',          'Módulo 7 · Vistoria, Pós-venda e Retenção',          '9','7','7']
  ];
  i int;
  velho text; novo text; nv_old text; nv_new text; nova_ordem int;
begin
  select id into t from public.tenants where slug = 'matriz';
  if t is null then raise notice 'Tenant "matriz" nao encontrado.'; return; end if;

  for i in 1 .. array_length(pares, 1) loop
    velho     := pares[i][1];
    novo      := pares[i][2];
    nv_old    := pares[i][3];
    nv_new    := pares[i][4];
    nova_ordem := pares[i][5]::int;

    select id into m from public.modulos where tenant_id = t and titulo = velho;
    if m is not null then
      update public.modulos set titulo = novo, ordem = nova_ordem where id = m;

      update public.itens set
        titulo = replace(
                   replace(titulo, 'Aula ' || nv_old || '.', 'Aula ' || nv_new || '.'),
                   'Apostila ' || nv_old, 'Apostila ' || nv_new),
        descricao = replace(
                      replace(descricao, 'MÓDULO ' || nv_old, 'MÓDULO ' || nv_new),
                      'Módulo ' || nv_old, 'Módulo ' || nv_new)
      where modulo_id = m;
    end if;
  end loop;

  raise notice 'Modulos de vendas renumerados para 1 a 7.';
end $$;
