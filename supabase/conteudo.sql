-- ============================================================
-- TODOS PROTEGIDOS — Conteúdo COMPLETO da trilha (do novato ao pro)
-- 7 módulos · aulas com roteiros/scripts · 10 questões por módulo.
-- Baseado em SPIN Selling, Challenger Sale e Sandler, aplicados à
-- proteção veicular. Rode UMA VEZ no SQL Editor (depois de schema.sql,
-- progress.sql e quiz.sql). Idempotente: pula módulos já existentes.
-- Popula o tenant de slug 'matriz' (ajuste abaixo se for outro).
-- ============================================================
do $$
declare
  t uuid;
  m uuid;
begin
  select id into t from public.tenants where slug = 'matriz';
  if t is null then raise notice 'Tenant "matriz" nao encontrado. Crie o tenant antes.'; return; end if;

  -- =========================================================
  -- MÓDULO 1 — Fundamentos da Proteção Veicular
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 1 · Fundamentos da Proteção Veicular';
  if m is null then
    insert into public.modulos (tenant_id, titulo, subtitulo, ordem)
      values (t, 'Módulo 1 · Fundamentos da Proteção Veicular', 'O produto, as coberturas e a diferença para o seguro', 1)
      returning id into m;

    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'aula', 'Aula 1.1 — O que é proteção veicular', 'Conceito e diferença para seguro',
     'OBJETIVO: entender o que vendemos e falar com segurança.

PONTOS-CHAVE:
- Proteção veicular é uma associação/rateio entre associados para cobrir prejuízos (roubo, furto, colisão, perda total). Não é seguro regulado pela SUSEP — é mutualismo.
- Vantagens: adesão sem análise de perfil rígida, sem consulta a score, mensalidade competitiva, assistência 24h.
- O consultor é o elo de confiança: explica com clareza e sem promessas falsas.

ROTEIRO DE FALA (90 segundos):
"Proteção veicular funciona como uma grande rede de motoristas que se ajudam: todos contribuem com um valor mensal e, quando alguém sofre um prejuízo, a rede cobre. Por isso conseguimos um custo menor e menos burocracia que o seguro tradicional, com assistência 24 horas e cobertura pela tabela FIPE em caso de perda total."', 1),

    (t, m, 'info', 'Aula 1.2 — Coberturas, FIPE e assistência 24h', 'O que está incluso',
     'COBERTURAS PADRÃO:
- Roubo e furto
- Colisão / perda total (indenização por 100% da tabela FIPE)
- Incêndio e fenômenos da natureza
- Assistência 24h: guincho, chaveiro, pane seca, troca de pneu
- Cobertura nacional

DICA DE VENDA: traduza cobertura em tranquilidade. Ex.: "Se o carro for roubado hoje, você recebe 100% da FIPE — não fica no prejuízo nem sem carro para trabalhar."', 2),

    (t, m, 'aula', 'Aula 1.3 — Carro x Moto: particularidades', 'Diferenças no atendimento',
     'CARRO: ticket maior, decisão mais racional, foco em patrimônio e família.
MOTO: alto risco de roubo, decisão emocional/urgente, foco em "ferramenta de trabalho".

ROTEIRO MOTO:
"Para quem trabalha com a moto, ficar sem ela é ficar sem renda. A proteção garante que, se acontecer algo, você volta a rodar rápido — com guincho e indenização."', 3),

    (t, m, 'file', 'Material — Glossário do associado', 'Termos essenciais',
     'Rateio, FIPE, carência, vistoria prévia, cota de participação, terceiros, perda total, sinistro. Saiba explicar cada um em 1 frase simples.', 4);

    insert into public.questoes (tenant_id, modulo_id, enunciado, opcoes, correta, ordem) values
    (t, m, 'O que melhor define a proteção veicular?', '["Um seguro regulado pela SUSEP","Um sistema de rateio/mutualismo entre associados","Um financiamento do veículo","Uma garantia de fábrica"]'::jsonb, 1, 1),
    (t, m, 'Em caso de perda total, a indenização padrão é de:', '["50% do valor de mercado","Um valor fixo em contrato","100% da tabela FIPE","O valor pago em mensalidades"]'::jsonb, 2, 2),
    (t, m, 'Uma vantagem da proteção veicular frente ao seguro tradicional é:', '["Cobrir apenas carros novos","Menos burocracia e sem consulta a score","Não ter assistência 24h","Validade só em um estado"]'::jsonb, 1, 3),
    (t, m, 'A assistência 24h normalmente inclui:', '["Somente guincho","Guincho, chaveiro, pane seca e troca de pneu","Troca de óleo gratuita","Lavagem do veículo"]'::jsonb, 1, 4),
    (t, m, 'Ao atender quem usa a MOTO para trabalhar, o melhor foco é:', '["O status da moto","Ficar sem renda se algo acontecer","A cor do veículo","O ano de fabricação apenas"]'::jsonb, 1, 5),
    (t, m, 'Traduzir cobertura em benefício significa:', '["Listar termos técnicos","Mostrar o que o cliente ganha na prática (tranquilidade)","Falar só de preço","Evitar explicar a cobertura"]'::jsonb, 1, 6),
    (t, m, 'A proteção veicular é fiscalizada pela SUSEP?', '["Sim, como seguro","Não — é associativa/mutualista","Sim, pelo Banco Central","Depende do estado"]'::jsonb, 1, 7),
    (t, m, 'Cobertura por fenômenos da natureza protege contra:', '["Multas de trânsito","Enchente, granizo e quedas de árvore","Desvalorização do carro","Manutenção preventiva"]'::jsonb, 1, 8),
    (t, m, 'No atendimento de CARRO, a decisão tende a ser mais:', '["Impulsiva","Racional, ligada a patrimônio e família","Aleatória","Baseada na cor"]'::jsonb, 1, 9),
    (t, m, 'O papel central do consultor é:', '["Empurrar o plano mais caro","Ser o elo de confiança que explica com clareza","Esconder carências","Prometer o que não existe"]'::jsonb, 1, 10);
  end if;

  -- =========================================================
  -- MÓDULO 2 — Mentalidade e Rotina de Alta Performance
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 2 · Mentalidade e Rotina de Alta Performance';
  if m is null then
    insert into public.modulos (tenant_id, titulo, subtitulo, ordem)
      values (t, 'Módulo 2 · Mentalidade e Rotina de Alta Performance', 'Disciplina, metas e funil de vendas', 2)
      returning id into m;

    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'aula', 'Aula 2.1 — Mentalidade de dono', 'Atitude do profissional',
     'PRINCÍPIOS:
- Você é dono do seu resultado: atividade gera venda.
- Constância vence talento: quem faz todos os dias, vende sempre.
- Foco no cliente, não na comissão — a comissão é consequência.

RITUAL DIÁRIO: revise metas, prepare scripts, separe a base de contatos do dia, registre tudo no CRM.', 1),

    (t, m, 'aula', 'Aula 2.2 — Metas e funil de vendas', 'Números que importam',
     'FUNIL: Contatos -> Conversas -> Cotações -> Vistorias -> Fechamentos.
REGRA: trabalhe de trás para frente. Quer 10 vendas/mês? Quantas cotações e contatos isso exige na sua taxa atual?

KPIs DO CONSULTOR:
- Nº de abordagens/dia
- Taxa de conversa em cotação
- Taxa de cotação em fechamento
- Ticket médio e comissão', 2),

    (t, m, 'info', 'Aula 2.3 — Gestão do tempo e CRM', 'Organização',
     'Blocos de tempo: prospecção de manhã, follow-up à tarde. Todo contato vira registro com próximo passo e data. Sem CRM, você perde dinheiro esquecido na agenda.', 3);

    insert into public.questoes (tenant_id, modulo_id, enunciado, opcoes, correta, ordem) values
    (t, m, 'O que mais sustenta o resultado de um consultor?', '["Sorte","Constância de atividade","Esperar indicações","Baixar o preço"]'::jsonb, 1, 1),
    (t, m, 'No funil de vendas, a sequência correta é:', '["Fechamento -> contato -> cotação","Contatos -> conversas -> cotações -> vistorias -> fechamentos","Cotação -> contato -> vistoria","Vistoria -> contato -> conversa"]'::jsonb, 1, 2),
    (t, m, 'Planejar metas "de trás para frente" significa:', '["Começar pelo fechamento desejado e calcular a atividade necessária","Não ter meta","Focar só no passado","Reduzir a meta sempre"]'::jsonb, 0, 3),
    (t, m, 'Um KPI essencial do consultor é:', '["A cor do carro do cliente","A taxa de cotação em fechamento","O clima do dia","O número de feriados"]'::jsonb, 1, 4),
    (t, m, 'A comissão deve ser vista como:', '["O único objetivo","Consequência de servir bem o cliente","Algo a esconder","Irrelevante"]'::jsonb, 1, 5),
    (t, m, 'Por que registrar todo contato no CRM?', '["Burocracia inútil","Para não perder follow-ups e oportunidades","Para enfeitar a tela","Só quando vender"]'::jsonb, 1, 6),
    (t, m, 'Uma boa estrutura de dia para prospecção é:', '["Prospectar de manhã e fazer follow-up à tarde","Só responder mensagens","Esperar o cliente ligar","Trabalhar sem blocos"]'::jsonb, 0, 7),
    (t, m, 'Mentalidade de dono é:', '["Culpar o mercado","Assumir responsabilidade pelo próprio resultado","Depender do gestor","Trabalhar só quando quer"]'::jsonb, 1, 8),
    (t, m, 'Se a taxa de fechamento cai, o primeiro passo é:', '["Desistir","Analisar o funil e identificar a etapa que trava","Baixar o preço","Reclamar do produto"]'::jsonb, 1, 9),
    (t, m, 'Aumentar o ticket médio significa:', '["Vender planos/coberturas mais completas quando fazem sentido","Enganar o cliente","Cobrar taxa escondida","Ignorar a necessidade"]'::jsonb, 0, 10);
  end if;

  -- =========================================================
  -- MÓDULO 3 — Prospecção e Abordagem
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 3 · Prospecção e Abordagem';
  if m is null then
    insert into public.modulos (tenant_id, titulo, subtitulo, ordem)
      values (t, 'Módulo 3 · Prospecção e Abordagem', 'Onde achar clientes e como iniciar a conversa', 3)
      returning id into m;

    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'aula', 'Aula 3.1 — Canais de prospecção', 'De onde vêm os clientes',
     'CANAIS:
- Indicação (o de maior conversão): sempre peça.
- Sinaleiro / ponto de fluxo: abordagem rápida para captar contato.
- Redes sociais e WhatsApp: conteúdo + resposta ágil.
- Parcerias: oficinas, lava-rápidos, motoristas de app.

REGRA DE OURO: prospecção é diária e em volume. Sem topo de funil, não há venda.', 1),

    (t, m, 'aula', 'Aula 3.2 — Roteiro de abordagem no sinaleiro', 'Script de 15 a 30 segundos',
     'OBJETIVO DO SINALEIRO: NÃO é vender ali. É captar o contato para um atendimento consultivo depois.

SCRIPT (15-30s):
"Bom dia! Tudo bem? Sou consultor da Todos Protegidos. Trabalho com proteção pro seu carro/moto com assistência 24h e indenização pela FIPE. Posso te mandar uma cotação rápida no WhatsApp, sem compromisso? Qual seu melhor número?"

REGRAS:
- Sorria, seja breve e educado.
- Não discuta preço no sinal.
- Anote o contato e o modelo do veículo.', 2),

    (t, m, 'aula', 'Aula 3.3 — Abordagem por WhatsApp', 'Primeira mensagem',
     'SCRIPT WHATSAPP (primeiro contato):
"Oi, [nome]! Aqui é o [seu nome], da Todos Protegidos. Foi ótimo falar com você agora há pouco. Para eu montar sua cotação certinha, seu carro é o [modelo/ano]? Em 1 minutinho te passo o valor e o que está incluso."

DICAS:
- Responda rápido (os primeiros minutos valem ouro).
- Use o nome da pessoa.
- Conduza para a cotação, não para um papo solto.', 3);

    insert into public.questoes (tenant_id, modulo_id, enunciado, opcoes, correta, ordem) values
    (t, m, 'Qual canal costuma ter a MAIOR taxa de conversão?', '["Anúncio frio","Indicação","Panfleto","E-mail em massa"]'::jsonb, 1, 1),
    (t, m, 'O objetivo principal da abordagem no sinaleiro é:', '["Fechar a venda no sinal","Captar o contato para um atendimento depois","Explicar todas as coberturas","Negociar preço"]'::jsonb, 1, 2),
    (t, m, 'O tempo ideal de uma abordagem em sinaleiro é:', '["2 a 3 minutos","15 a 30 segundos","O tempo que o cliente permitir","5 minutos"]'::jsonb, 1, 3),
    (t, m, 'No sinaleiro, você NÃO deve:', '["Sorrir","Ser breve","Discutir preço ali mesmo","Anotar o contato"]'::jsonb, 2, 4),
    (t, m, 'Ao receber um contato novo no WhatsApp, o ideal é:', '["Responder em alguns dias","Responder o mais rápido possível","Mandar só link","Esperar ele insistir"]'::jsonb, 1, 5),
    (t, m, 'A primeira mensagem de WhatsApp deve:', '["Ser genérica","Usar o nome e conduzir para a cotação","Pedir o pagamento","Listar termos técnicos"]'::jsonb, 1, 6),
    (t, m, 'Prospecção eficaz é, acima de tudo:', '["Esporádica","Diária e em volume","Só quando falta meta","Feita uma vez por mês"]'::jsonb, 1, 7),
    (t, m, 'Boas parcerias para captar clientes são:', '["Concorrentes diretos","Oficinas, lava-rápidos e motoristas de app","Órgãos de trânsito","Ninguém"]'::jsonb, 1, 8),
    (t, m, 'Pedir indicação deve ser:', '["Evitado","Um hábito em todo atendimento","Feito só com amigos","Constrangedor"]'::jsonb, 1, 9),
    (t, m, 'No sinaleiro, além do contato, vale anotar:', '["A placa para multar","O modelo/ano do veículo","O nome do banco dele","Nada"]'::jsonb, 1, 10);
  end if;

  -- =========================================================
  -- MÓDULO 4 — Diagnóstico com SPIN Selling
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 4 · Diagnóstico com SPIN Selling';
  if m is null then
    insert into public.modulos (tenant_id, titulo, subtitulo, ordem)
      values (t, 'Módulo 4 · Diagnóstico com SPIN Selling', 'Perguntas que levam o cliente a decidir', 4)
      returning id into m;

    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'aula', 'Aula 4.1 — As 4 perguntas SPIN', 'Situação, Problema, Implicação, Necessidade',
     'SPIN = roteiro de perguntas para venda consultiva:
- SITUAÇÃO: entender o contexto. "Qual carro você tem e como usa no dia a dia?"
- PROBLEMA: revelar a dor. "Hoje você tem alguma proteção? Já passou perrengue com guincho?"
- IMPLICAÇÃO: ampliar a dor. "Se o carro fosse roubado amanhã, como ficaria seu trabalho/sua família?"
- NECESSIDADE DE SOLUÇÃO: o cliente verbaliza o ganho. "Faria diferença ter indenização pela FIPE e guincho 24h?"

REGRA: ouça mais do que fala. Quem pergunta bem, conduz.', 1),

    (t, m, 'aula', 'Aula 4.2 — Roteiro SPIN na proteção veicular', 'Script completo',
     'SCRIPT GUIADO:
1) "Me conta: qual o veículo e pra que você mais usa ele?" (Situação)
2) "Você já tem proteção hoje? O que te preocupa em ficar sem?" (Problema)
3) "Imagina um roubo ou perda total sem cobertura — qual seria o impacto no seu bolso e na rotina?" (Implicação)
4) "Então, ter 100% da FIPE e assistência 24h resolveria essa preocupação, certo?" (Necessidade)

Depois da etapa 4, o cliente já quer a solução — aí você apresenta o plano.', 2);

    insert into public.questoes (tenant_id, modulo_id, enunciado, opcoes, correta, ordem) values
    (t, m, 'O que significa a sigla SPIN?', '["Situação, Problema, Implicação, Necessidade","Solução, Preço, Indicação, Negócio","Serviço, Produto, Itens, Nota","Sondagem, Plano, Index, Network"]'::jsonb, 0, 1),
    (t, m, 'A pergunta de SITUAÇÃO serve para:', '["Fechar a venda","Entender o contexto do cliente","Falar de preço","Apresentar o plano"]'::jsonb, 1, 2),
    (t, m, 'A pergunta de IMPLICAÇÃO tem o papel de:', '["Reduzir a dor","Ampliar a consciência do problema e suas consequências","Encerrar o atendimento","Dar desconto"]'::jsonb, 1, 3),
    (t, m, 'Exemplo de pergunta de PROBLEMA:', '["Qual a cor do carro?","Hoje você tem alguma proteção? O que te preocupa?","Qual seu CPF?","Quer fechar agora?"]'::jsonb, 1, 4),
    (t, m, 'Na etapa de NECESSIDADE DE SOLUÇÃO, o ideal é que:', '["O vendedor fale o tempo todo","O cliente verbalize o ganho da solução","Se ignore a dor","Se apresente o preço primeiro"]'::jsonb, 1, 5),
    (t, m, 'Princípio central do SPIN:', '["Falar mais que o cliente","Ouvir mais e perguntar bem","Pressionar","Decorar o preço"]'::jsonb, 1, 6),
    (t, m, 'O SPIN é mais indicado para:', '["Vendas simples e impulsivas","Vendas consultivas e mais complexas","Não serve para proteção veicular","Apenas e-commerce"]'::jsonb, 1, 7),
    (t, m, 'Qual a ordem correta das perguntas?', '["Implicação, Situação, Problema, Necessidade","Situação, Problema, Implicação, Necessidade","Necessidade, Problema, Situação, Implicação","Problema, Necessidade, Situação, Implicação"]'::jsonb, 1, 8),
    (t, m, 'Depois de uma boa etapa de Necessidade, o próximo passo é:', '["Encerrar","Apresentar o plano/solução","Recomeçar do zero","Dar desconto"]'::jsonb, 1, 9),
    (t, m, 'Um erro comum no diagnóstico é:', '["Perguntar e ouvir","Apresentar a solução antes de entender a dor","Anotar respostas","Personalizar o atendimento"]'::jsonb, 1, 10);
  end if;

  -- =========================================================
  -- MÓDULO 5 — Apresentação de Valor (Challenger) + FIPE
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 5 · Apresentação de Valor (Challenger)';
  if m is null then
    insert into public.modulos (tenant_id, titulo, subtitulo, ordem)
      values (t, 'Módulo 5 · Apresentação de Valor (Challenger)', 'Ensinar, personalizar e mostrar o risco invisível', 5)
      returning id into m;

    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'aula', 'Aula 5.1 — Ensine o risco que o cliente não vê', 'Método Challenger',
     'CHALLENGER = Ensinar, Personalizar, Assumir o controle.
A ideia: trazer um insight que o cliente ainda não tinha.

EXEMPLOS DE INSIGHT:
- "A maioria acha que roubo é o maior risco, mas a colisão com perda total é mais frequente e mais cara."
- "Sem proteção, o prejuízo não é só o carro: é ficar sem trabalhar e ainda pagar financiamento de um bem que não existe mais."

Personalize o insight para a realidade do cliente (uso, região, tipo de veículo).', 1),

    (t, m, 'aula', 'Aula 5.2 — Ancoragem de valor e comparação', 'Preço x valor',
     'TÉCNICA:
- Ancore no risco evitado: "Quanto custaria repor seu carro hoje? A FIPE dele é R$ X. A proteção custa centavos por dia disso."
- Compare custo/benefício, não só preço: assistência 24h, sem score, menos burocracia.
- Use prova: casos reais de associados atendidos.

EVITE: brigar por preço. Reposicione para valor.', 2),

    (t, m, 'aula', 'Aula 5.3 — Roteiro de apresentação', 'Script',
     'SCRIPT:
"Pelo que você me contou, o que mais pesa é [dor do cliente]. Nosso plano resolve assim: [cobertura ligada à dor]. Em caso de perda total, você recebe 100% da FIPE — hoje cerca de R$ [valor]. E tem guincho 24h pra você nunca ficar na mão. Tudo isso por R$ [mensalidade], menos que [comparação do dia a dia]."', 3);

    insert into public.questoes (tenant_id, modulo_id, enunciado, opcoes, correta, ordem) values
    (t, m, 'Os 3 pilares do Challenger Sale são:', '["Ensinar, Personalizar, Assumir o controle","Empurrar, Pressionar, Fechar","Falar, Falar, Falar","Descontar, Insistir, Encerrar"]'::jsonb, 0, 1),
    (t, m, 'O diferencial do vendedor Challenger é:', '["Dar o menor preço","Trazer um insight que o cliente nao tinha","Evitar conversa","Prometer tudo"]'::jsonb, 1, 2),
    (t, m, 'Ancorar valor significa:', '["Comparar a mensalidade com o risco/valor do bem","Falar só do preço","Esconder coberturas","Dar desconto imediato"]'::jsonb, 0, 3),
    (t, m, 'Quando o cliente foca só no preço, o ideal é:', '["Brigar por preço","Reposicionar para valor (custo-benefício)","Desistir","Baixar até o limite"]'::jsonb, 1, 4),
    (t, m, 'Um bom insight Challenger para proteção veicular é:', '["A cor influencia o roubo","Colisao com perda total e frequente e cara, nem todos percebem","O carro nunca dá problema","Proteção é igual em todo lugar"]'::jsonb, 1, 5),
    (t, m, 'Personalizar a apresentação é:', '["Usar o mesmo discurso para todos","Adaptar o insight à realidade do cliente","Falar só de você","Ignorar o diagnóstico"]'::jsonb, 1, 6),
    (t, m, 'Prova social na venda é:', '["Inventar números","Usar casos reais de associados atendidos","Prometer milagres","Mostrar só preço"]'::jsonb, 1, 7),
    (t, m, '"Assumir o controle" da conversa significa:', '["Ser grosseiro","Conduzir com firmeza e segurança, inclusive no preço","Falar sem parar","Aceitar tudo que o cliente impõe"]'::jsonb, 1, 8),
    (t, m, 'Ao apresentar o plano, conecte sempre a cobertura à:', '["Sua comissão","Dor/necessidade que o cliente revelou","Tabela de preços do concorrente","Cor do carro"]'::jsonb, 1, 9),
    (t, m, 'Comparar a mensalidade com um gasto cotidiano serve para:', '["Confundir","Tornar o valor tangível e pequeno frente ao benefício","Esconder o preço","Aumentar a objeção"]'::jsonb, 1, 10);
  end if;

  -- =========================================================
  -- MÓDULO 6 — Fechamento e Objeções (Sandler)
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 6 · Fechamento e Tratamento de Objeções';
  if m is null then
    insert into public.modulos (tenant_id, titulo, subtitulo, ordem)
      values (t, 'Módulo 6 · Fechamento e Tratamento de Objeções', 'Conduzir à decisão sem pressão', 6)
      returning id into m;

    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'aula', 'Aula 6.1 — Técnicas de fechamento', 'Pergunta de continuidade',
     'EM VEZ DE "Você quer fechar?", use a PERGUNTA DE CONTINUIDADE:
"Para já deixar sua proteção ativa hoje, vou precisar confirmar alguns dados, ok?"

OUTRAS:
- Fechamento por alternativa: "Prefere começar no plano Essencial ou no Total?"
- Resumo de valor + próximo passo: recapitule o ganho e conduza à vistoria.

REGRA: peça a venda com naturalidade. Quem não pede, não fecha.', 1),

    (t, m, 'aula', 'Aula 6.2 — Tratando objeções (scripts)', 'Está caro / vou pensar / tenho seguro',
     'TÉCNICA: acolher -> esclarecer -> reconduzir.

"ESTÁ CARO":
"Entendo. Caro comparado a quê? Veja: por R$ [x] por dia você protege um bem de R$ [FIPE] e ainda tem guincho 24h. O caro mesmo é ficar sem o carro e sem indenização."

"VOU PENSAR":
"Claro. Só pra eu te ajudar melhor: o que ainda falta ficar claro — é a cobertura, o valor ou a forma de ativar?"

"JÁ TENHO SEGURO":
"Que bom que se preocupa em se proteger. Posso te mostrar onde a proteção veicular costuma sair mais em conta e com menos burocracia? Sem compromisso."', 2);

    insert into public.questoes (tenant_id, modulo_id, enunciado, opcoes, correta, ordem) values
    (t, m, 'Em vez de "Você quer fechar?", o ideal é usar:', '["Pressão com prazo","Pergunta de continuidade","Silêncio","Mais desconto"]'::jsonb, 1, 1),
    (t, m, 'O fechamento por alternativa é:', '["Oferecer só um plano","Dar duas boas opções para o cliente escolher","Não oferecer nada","Forçar o mais caro"]'::jsonb, 1, 2),
    (t, m, 'A estrutura recomendada para objeções é:', '["Ignorar, insistir, encerrar","Acolher, esclarecer, reconduzir","Discutir, pressionar, desistir","Baixar preço sempre"]'::jsonb, 1, 3),
    (t, m, 'Diante de "está caro", a melhor reação é:', '["Baixar o preço na hora","Reposicionar para valor e o risco de ficar sem","Encerrar","Concordar que é caro"]'::jsonb, 1, 4),
    (t, m, 'Quando o cliente diz "vou pensar", você deve:', '["Aceitar e sumir","Perguntar o que ainda falta ficar claro","Pressionar com prazo","Dar desconto"]'::jsonb, 1, 5),
    (t, m, 'Para quem "já tem seguro", a melhor postura é:', '["Criticar o seguro dele","Mostrar onde a proteção veicular pode ser vantajosa, sem compromisso","Desistir","Dizer que seguro é ruim"]'::jsonb, 1, 6),
    (t, m, 'Pedir a venda com naturalidade é:', '["Opcional","Essencial — quem não pede, não fecha","Falta de educação","Sinal de fraqueza"]'::jsonb, 1, 7),
    (t, m, 'Objeção, na maioria das vezes, é sinal de:', '["Falta de interesse total","Dúvida que precisa ser esclarecida","Que o cliente quer brigar","Que a venda acabou"]'::jsonb, 1, 8),
    (t, m, 'Pressionar o cliente com prazo imediato tende a:', '["Aumentar a confiança","Gerar resistência e perder a venda","Ser a melhor técnica","Encurtar saudavelmente o ciclo"]'::jsonb, 1, 9),
    (t, m, 'Após contornar a objeção, o próximo passo é:', '["Recomeçar tudo","Reconduzir para o fechamento/vistoria","Encerrar o atendimento","Mudar de assunto"]'::jsonb, 1, 10);
  end if;

  -- =========================================================
  -- MÓDULO 7 — Vistoria, Pós-venda e Retenção
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 7 · Vistoria, Pós-venda e Retenção';
  if m is null then
    insert into public.modulos (tenant_id, titulo, subtitulo, ordem)
      values (t, 'Módulo 7 · Vistoria, Pós-venda e Retenção', 'Ativar, encantar e fidelizar', 7)
      returning id into m;

    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'aula', 'Aula 7.1 — Protocolo de vistoria', 'Ativação sem erro',
     'CHECKLIST DE VISTORIA:
- Fotos nítidas: frente, traseira, laterais, painel (hodômetro), chassi e pneus.
- Documento do veículo em foto (formato aceito pelo app; PDF normalmente não é aceito).
- Confira dados do associado e do veículo antes de enviar.
- Explique a carência ao cliente para evitar frustração.

Vistoria bem feita = ativação rápida e menos retrabalho.', 1),

    (t, m, 'aula', 'Aula 7.2 — Pós-venda, indicação e reativação', 'Carteira que rende',
     'PÓS-VENDA (script de boas-vindas):
"[nome], sua proteção está ativa! Salva meu contato — qualquer necessidade de guincho ou dúvida, fala comigo direto. E se conhecer alguém que precise, sua indicação vale muito."

REATIVAÇÃO de ex-associado (condição especial comum: isenção da 2a mensalidade):
"[nome], preparei uma condição especial pra você voltar a ficar protegido: isenção da 2a mensalidade. Posso reativar hoje?"

RETENÇÃO: contato periódico, lembrete de assistência, pedido de indicação.', 2);

    insert into public.questoes (tenant_id, modulo_id, enunciado, opcoes, correta, ordem) values
    (t, m, 'Na vistoria pelo app, o formato de documento normalmente aceito é:', '["PDF","Imagem/foto (JPG)","Áudio","Planilha"]'::jsonb, 1, 1),
    (t, m, 'Uma vistoria bem feita resulta em:', '["Mais retrabalho","Ativação rápida e menos pendências","Atraso garantido","Recusa do cliente"]'::jsonb, 1, 2),
    (t, m, 'Entre as fotos essenciais da vistoria estão:', '["Só a frente","Frente, traseira, laterais, painel, chassi e pneus","Apenas o painel","Foto do consultor"]'::jsonb, 1, 3),
    (t, m, 'Explicar a carência ao cliente serve para:', '["Confundir","Evitar frustração e alinhar expectativa","Esconder regras","Atrasar a venda"]'::jsonb, 1, 4),
    (t, m, 'O pós-venda bem feito gera principalmente:', '["Cancelamentos","Indicações e fidelização","Reclamações","Nada"]'::jsonb, 1, 5),
    (t, m, 'Uma condição comum na reativação de ex-associado é:', '["Devolução de todas as mensalidades","Isenção da 2a mensalidade","Proteção gratuita por 1 ano","Carro reserva permanente"]'::jsonb, 1, 6),
    (t, m, 'A melhor hora de pedir indicação é:', '["Nunca","No pós-venda, com o cliente satisfeito","Só se ele reclamar","Antes de ativar"]'::jsonb, 1, 7),
    (t, m, 'Reter a carteira exige:', '["Sumir após a venda","Contato periódico e suporte ágil","Cobrar mais","Ignorar dúvidas"]'::jsonb, 1, 8),
    (t, m, 'Antes de enviar a vistoria, o consultor deve:', '["Conferir dados do associado e do veículo","Enviar sem revisar","Apagar as fotos","Pedir o pagamento em dinheiro"]'::jsonb, 0, 9),
    (t, m, 'A mensagem de boas-vindas no pós-venda deve incluir:', '["Cobrança extra","Como acionar a assistência e o pedido de indicação","Termos jurídicos","Nada de útil"]'::jsonb, 1, 10);
  end if;

  raise notice 'Conteudo da trilha inserido/atualizado para o tenant matriz.';
end $$;
