-- ============================================================
-- TODOS PROTEGIDOS UNIVERSITY — Boas práticas do mercado (pesquisa web)
--
-- Adiciona a cada módulo de vendas (3 a 9) uma aula de leitura
-- "Boas práticas do mercado", destilada de referências consagradas de
-- vendas e de conteúdos especializados em proteção veicular, com as FONTES
-- citadas ao final de cada aula.
--
-- Rode no SQL Editor DEPOIS de conteudo.sql e conteudo-aprofundado.sql.
-- Idempotente: cada aula só é inserida se ainda não existir (por título).
-- ============================================================
do $$
declare t uuid; m uuid;
begin
  select id into t from public.tenants where slug = 'matriz';
  if t is null then raise notice 'Tenant "matriz" nao encontrado.'; return; end if;

  -- ---- MÓDULO 3 — Fundamentos ----
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 3 · Fundamentos da Proteção Veicular';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 3.5 — Boas práticas do mercado (pesquisa)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 3.5 — Boas práticas do mercado (pesquisa)', 'Referências de mercado',
'O que os melhores materiais do mercado recomendam sobre vender proteção veicular:

1. CONHEÇA O PRODUTO A FUNDO. Especialistas são unânimes: o consultor precisa dominar coberturas, carências e a diferença para o seguro. Insegurança técnica derruba a venda; domínio gera confiança.

2. ADAPTE A OFERTA AO PERFIL DE USO. Quem usa o veículo para TRABALHO valoriza coberturas e assistência que evitam ficar parado (guincho, agilidade). Quem usa para LAZER valoriza tranquilidade, rastreamento e assistência 24h. Faça a pergunta de uso antes de oferecer o plano.

3. VENDA CRUZADA (CROSS-SELL) AUMENTA O TICKET. Quando fizer sentido para o cliente, apresente serviços complementares (rastreamento, assistência ampliada, proteções adicionais). Isso eleva o valor percebido e o ticket médio — desde que resolva uma necessidade real, nunca empurrado.

4. ABORDAGEM CONSULTIVA, NUNCA "VENDEDOR CHATO". As referências reforçam: as pessoas compram de quem ouve e ajuda, não de quem pressiona. Deixe o cliente falar, espelhe a linguagem dele e conduza com perguntas.

FONTES (consultadas em 2026):
- redeparcerias.com/blog/como-vender-protecao-veicular
- alloyal.com.br/blog/como-vender-protecao-veicular
- kommo.com/br/blog/consultor-de-vendas
- wewritebetter.com.br/blog/como-vender-protecao-veicular', 5);
  end if;

  -- ---- MÓDULO 4 — Mentalidade ----
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 4 · Mentalidade e Rotina de Alta Performance';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 4.5 — Boas práticas do mercado (pesquisa)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 4.5 — Boas práticas do mercado (pesquisa)', 'Referências de mercado',
'O que os materiais de alta performance em vendas recomendam:

1. PROSPECÇÃO É PROCESSO, NÃO EVENTO. Selecionar uma quantidade fixa de novos contatos por dia e registrá-los no CRM transforma a meta em rotina previsível. Sem topo de funil constante, o resultado oscila.

2. PIPELINE ORGANIZADO POR ETAPA. As referências recomendam mover cada lead por etapas claras (novo, em conversa, cotado, em vistoria, fechado) e definir o próximo passo de cada um. O que está sem próximo passo definido tende a morrer.

3. QUALIFICAÇÃO ANTES DE INVESTIR TEMPO. Nem todo contato tem o mesmo potencial. Identifique cedo quem tem fit (veículo, intenção, urgência) para priorizar energia onde há mais chance de fechar.

4. ESTUDE O SEU CLIENTE IDEAL. Defina o perfil que mais compra e mais permanece (tipo de uso, faixa de veículo, região) e direcione a prospecção para ele. Foco vende mais que dispersão.

FONTES (consultadas em 2026):
- cortex-intelligence.com/blog/vendas/prospeccao-de-clientes
- skrapp.io/blog/pt/prospeccao-de-clientes
- agendor.com.br/blog (prospecção e funil)', 5);
  end if;

  -- ---- MÓDULO 5 — Prospecção ----
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 5 · Prospecção e Abordagem';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 5.5 — Boas práticas do mercado (pesquisa)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 5.5 — Boas práticas do mercado (pesquisa)', 'Referências de mercado',
'O que as referências de prospecção e WhatsApp recomendam:

1. O WHATSAPP TEM ALCANCE IMBATÍVEL. Mensagens no WhatsApp chegam a taxas de abertura próximas de 99% — dificilmente são ignoradas. Por isso é o melhor canal para primeiro contato e follow-up no nosso ramo.

2. ÁUDIOS CURTOS E BEM ARTICULADOS. Áudios de até ~40 segundos, claros e objetivos, transmitem confiança e proximidade de forma mais humana que textos longos. Use-os para criar conexão; use texto quando o cliente preferir ler.

3. PROSPECÇÃO ATIVA x PASSIVA. Ativa = você procura o lead (sinaleiro, parcerias, listas). Passiva = o lead chega por conteúdo/indicação. O consultor de resultado combina as duas e não depende só de quem aparece.

4. O FOLLOW-UP É ONDE A VENDA ACONTECE. A maioria das vendas exige VÁRIOS contatos — e a maioria dos vendedores desiste cedo demais. Tenha modelos prontos (1ª abordagem, follow-up curto, convite para cotação/vistoria) e agende cada retorno no CRM.

5. ABERTURA COM CONTEXTO. Apresente-se e diga como chegou até o cliente ("falamos agora há pouco", "fulano me passou seu contato"). Contexto gera confiança; mensagem genérica é ignorada.

FONTES (consultadas em 2026):
- agendor.com.br/blog/pre-vendas-pelo-whatsapp
- meetime.com.br/blog/vendas/como-abordar-um-cliente-pelo-whatsapp
- socialhub.pro/blog (prospecção ativa no WhatsApp)
- blog.plotado.com.br/post/prospeccao-ativa-whatsapp-6-passos-gerar-mais-leads', 6);
  end if;

  -- ---- MÓDULO 6 — SPIN ----
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 6 · Diagnóstico com SPIN Selling';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 6.4 — Boas práticas do mercado (pesquisa)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 6.4 — Boas práticas do mercado (pesquisa)', 'Referências de mercado',
'O que as referências de SPIN Selling reforçam:

1. A METODOLOGIA NASCEU DE PESQUISA REAL. Neil Rackham analisou cerca de 35.000 ligações de vendas em mais de 20 países. A conclusão: em vendas de maior valor, quem faz as PERGUNTAS certas vende mais que quem só argumenta. Não é "achismo" — é dado.

2. A PERGUNTA DE IMPLICAÇÃO É O CORAÇÃO DO MÉTODO. É ela que faz a transição: amplia a consciência do problema e cria a urgência que leva o cliente a querer a solução. A maioria dos vendedores pula essa etapa — e é justamente nela que está a virada.

3. SITUAÇÃO COM MODERAÇÃO. Perguntas de situação são necessárias para entender o contexto, mas em excesso viram interrogatório e cansam. Colete o essencial e avance para problema e implicação.

4. NEED-PAYOFF: FAÇA O CLIENTE DIZER O GANHO. As perguntas de necessidade de solução levam o cliente a verbalizar o benefício ("sim, isso me ajudaria"). Quando ele mesmo diz, a resistência ao fechamento despenca.

ADAPTAÇÃO PARA PROTEÇÃO VEICULAR:
Situação = veículo e uso. Problema = falta de proteção e perrengues. Implicação = impacto de um roubo/perda total (renda, financiamento, família). Need-payoff = "ter 100% da FIPE e guincho 24h resolveria isso?".

FONTES (consultadas em 2026):
- reev.co/spin-selling-perguntas-de-implicacao
- receitaprevisivel.com/blog/perguntas-spin-selling
- lucidchart.com/blog/pt/as-4-perguntas-do-spin-selling
- dnadevendas.com.br/blog/spin-selling', 4);
  end if;

  -- ---- MÓDULO 7 — Challenger ----
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 7 · Apresentação de Valor (Challenger)';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 7.5 — Boas práticas do mercado (pesquisa)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 7.5 — Boas práticas do mercado (pesquisa)', 'Referências de mercado',
'O que as referências do Challenger Sale reforçam:

OS 3 Ts (em inglês, como aparecem na literatura):
- TEACH (Ensinar): oferecer um insight de mercado que o cliente não tinha — muitas vezes revelando um risco que ele subestimava. Ensinar gera AUTORIDADE e diferencia você do vendedor comum.
- TAILOR (Personalizar): adaptar a mensagem e a solução ao que mais preocupa AQUELE cliente. Discurso genérico converte pouco; personalizado converte muito.
- TAKE CONTROL (Assumir o controle): conduzir o processo com firmeza, manter o ritmo e não deixar a negociação se arrastar — inclusive falando de preço com naturalidade.

O PRINCÍPIO CENTRAL: CRIAR VALOR ANTES DE PEDIR A DECISÃO. Como o vendedor educa o cliente, ele cria valor imediato e se diferencia da concorrência. No nosso ramo, o insight clássico que "ensina" é: perda total por colisão costuma ser mais frequente e mais cara que o roubo — e quase ninguém se prepara para isso.

QUANDO USAR: a venda desafiadora brilha quando o cliente acha que "não precisa" ou que "já está protegido". Em vez de concordar, você reposiciona a percepção de risco com fatos.

FONTES (consultadas em 2026):
- br24.io/blog/metodologia-de-vendas-challenger-sale
- meetime.com.br/blog/vendas/challenger-sale
- agendor.com.br/blog/challenger-sale
- cortex-intelligence.com/blog/challenger-sale', 5);
  end if;

  -- ---- MÓDULO 8 — Fechamento e Objeções ----
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 8 · Fechamento e Tratamento de Objeções';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 8.4 — Boas práticas do mercado (pesquisa)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 8.4 — Boas práticas do mercado (pesquisa)', 'Referências de mercado',
'O que as referências de contorno de objeções recomendam:

A ESTRUTURA QUE OS ESPECIALISTAS ENSINAM (igual à do nosso módulo):
1) EMPATIA — valide o que o cliente disse, mostre que ouviu.
2) VALOR — traga um diferencial, benefício ou comparação que ajude a enxergar melhor.
3) RECONDUÇÃO — uma pergunta ou direcionamento que leva de volta ao fechamento.

"ESTÁ CARO" = PEDIDO DE JUSTIFICATIVA DE VALOR, não recusa. Compare o custo com o prejuízo evitado. Exemplo de mercado: "um reparo médio de batida custa alguns milhares de reais; a proteção evita esse prejuízo e ainda te dá assistência. É investimento, não gasto." Quando fizer sentido, ajuste a cobertura ao orçamento sem perder a essência.

"VOU PENSAR" = MANTENHA A CONVERSA ABERTA SEM PRESSIONAR. Descubra o que falta esclarecer e MARQUE UM RETORNO com data. Deixar em aberto é perder; agendar mostra comprometimento.

"JÁ TENHO SEGURO / PROTEÇÃO" = INFORME E DIFERENCIE, SEM DEPRECIAR. "A proteção veicular funciona por rateio entre associados; o seguro é regulado pela SUSEP. Posso te mostrar as diferenças para você escolher com segurança." Autoridade e transparência derrubam a objeção e evitam objeções futuras.

REGRA DE OURO: objeção é sinal de DÚVIDA (e de interesse), não de "não". Quem domina a resposta certa transforma incerteza em fechamento.

FONTES (consultadas em 2026):
- akadseguros.com.br/blog/vendas (contorno de objeções em seguros)
- isystempro.com.br (treinamento "está caro / vou pensar")
- zenivox.com.br/contornar-objecoes (o cliente diz "vou pensar")
- nfe.io/blog (quando o cliente diz que está caro)', 4);
  end if;

  -- ---- MÓDULO 9 — Vistoria, Pós-venda e Retenção ----
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 9 · Vistoria, Pós-venda e Retenção';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 9.4 — Boas práticas do mercado (pesquisa)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 9.4 — Boas práticas do mercado (pesquisa)', 'Referências de mercado',
'O que as referências de pós-venda e retenção comprovam:

1. RETER É MUITO MAIS BARATO QUE CONQUISTAR. Estudos de mercado mostram que conquistar um cliente novo custa de 5 a 25 vezes mais do que reter um atual. E aumentar a retenção em torno de 5% pode elevar o lucro de forma expressiva. Cuidar da carteira é a decisão financeira mais inteligente que existe.

2. TODA ETAPA APÓS A VENDA TAMBÉM É VENDA. Entrega, atendimento, renovação, upgrade e indicação fazem parte do ciclo. Quem entende que a primeira venda é só o começo constrói um ciclo virtuoso e sustentável.

3. CLIENTE FIEL GASTA MAIS E INDICA MAIS. O boca a boca de um associado satisfeito vem com confiança embutida — converte muito mais que qualquer anúncio. Programa/cultura de indicação é via de mão dupla: engaja quem já é cliente e atrai novos qualificados.

4. PÓS-VENDA É RELACIONAMENTO ATIVO. Não basta vender e sumir: contato de boas-vindas, orientação de como acionar a assistência, check-ins periódicos e presença no momento de necessidade são o que transformam um comprador em associado fiel.

APLICAÇÃO NA TODOS PROTEGIDOS:
- Ative rápido (vistoria bem feita) e dê boas-vindas no mesmo dia.
- Oriente sempre os canais corretos (0800 para assistência/sinistro; Setor de Eventos para eventos em andamento).
- Peça indicação com o cliente satisfeito, de forma específica.
- Reative ex-associados com condição real quando houver.

FONTES (consultadas em 2026):
- dnadevendas.com.br/blog/retencao-de-clientes
- rdstation.com/blog/vendas/pos-vendas
- wake.tech/blog/pos-venda-na-fidelizacao-estrategias
- agendor.com.br/blog/retencao-e-fidelizacao-de-clientes', 5);
  end if;

  raise notice 'Boas praticas do mercado (pesquisa) adicionadas aos modulos de vendas.';
end $$;
