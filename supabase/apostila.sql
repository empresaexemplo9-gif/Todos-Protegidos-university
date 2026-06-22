-- ============================================================
-- TODOS PROTEGIDOS UNIVERSITY — APOSTILA COMPLETA (estudo por leitura)
--
-- Foco do treinamento: o ALUNO LÊ PARA ESTUDAR. Os vídeos complementam a
-- prática, mas o núcleo do aprendizado é esta apostila.
--
-- Adiciona a cada módulo de vendas (3 a 9) uma aula "Apostila completa"
-- (ordem 0 = aparece primeiro), escrita em formato de capítulo de estudo:
-- introdução, objetivos de aprendizagem, teoria aprofundada, exemplos,
-- estudo de caso, erros comuns, resumo e perguntas de fixação.
--
-- Rode no SQL Editor DEPOIS de conteudo.sql e conteudo-aprofundado.sql.
-- Idempotente: cada apostila só é inserida se ainda não existir.
-- ============================================================
do $$
declare t uuid; m uuid;
begin
  select id into t from public.tenants where slug = 'matriz';
  if t is null then raise notice 'Tenant "matriz" nao encontrado.'; return; end if;

  -- =========================================================
  -- MÓDULO 3 — Fundamentos da Proteção Veicular
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 3 · Fundamentos da Proteção Veicular';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Apostila 3 — Fundamentos da Proteção Veicular (estudo completo)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Apostila 3 — Fundamentos da Proteção Veicular (estudo completo)', 'Leitura de estudo · ~15 min',
'APOSTILA DO MÓDULO 3 — FUNDAMENTOS DA PROTEÇÃO VEICULAR

== POR QUE ESTE MÓDULO IMPORTA ==
Ninguém vende bem o que não entende. Antes de qualquer técnica de abordagem, fechamento ou contorno de objeção, o consultor precisa dominar o PRODUTO. Este módulo é a fundação de toda a sua carreira: é aqui que você passa a falar de proteção veicular com a segurança de quem sabe exatamente o que está oferecendo. Cliente percebe domínio em segundos — e confia em quem demonstra domínio.

== OBJETIVOS DE APRENDIZAGEM ==
Ao final desta apostila, você deverá ser capaz de:
1. Explicar, em linguagem simples, o que é proteção veicular e como funciona o mutualismo.
2. Diferenciar com clareza proteção veicular de seguro tradicional.
3. Listar e traduzir as principais coberturas em benefícios práticos.
4. Explicar o conceito de tabela FIPE e usá-lo como ferramenta de venda.
5. Explicar a carência de forma transparente.
6. Adaptar o discurso ao perfil (carro x moto, trabalho x lazer).

== 1. O CONCEITO DE MUTUALISMO ==
Proteção veicular é um sistema de AJUDA MÚTUA. Um grupo de pessoas (os associados) se une e contribui mensalmente para um fundo comum. Quando um dos associados sofre um prejuízo coberto — roubo, furto, colisão com perda total, incêndio —, esse fundo coletivo cobre o prejuízo dele. É o princípio de "um por todos, todos por um" aplicado à proteção do veículo.

Repare na diferença de lógica: numa seguradora, você paga um prêmio e a empresa assume o risco visando lucro. Na proteção veicular, o dinheiro é dos próprios associados, administrado pela associação para proteger o grupo. Esse modelo, chamado de rateio, é o que permite custos menores e menos burocracia.

== 2. PROTEÇÃO VEICULAR x SEGURO: AS DIFERENÇAS QUE IMPORTAM ==
- Natureza: o seguro é um contrato regulado pela SUSEP; a proteção veicular é uma relação associativa (não é seguro). Nunca use as palavras como sinônimo — além de tecnicamente errado, pode gerar reclamação.
- Aceitação: a seguradora analisa perfil, score e histórico, e pode RECUSAR. A proteção veicular tem aceitação mais ampla e simples. Isso significa que o seu mercado é MAIOR: inclui quem foi recusado ou achou caro no seguro (jovem, carro antigo, motorista de app, histórico de sinistro).
- Custo: por ter menos custo administrativo e operar por rateio, a mensalidade costuma ser mais acessível.
- Indenização: na perda total, o padrão é 100% da tabela FIPE.
- Agilidade: adesão e atendimento com menos etapas.

Mensagem central: posicione a proteção como a escolha inteligente para a maioria dos motoristas, SEM atacar o seguro — apenas mostrando onde ela costuma sair na frente.

== 3. AS COBERTURAS (E COMO TRADUZI-LAS) ==
- Roubo e furto: se levarem o veículo, o associado é indenizado. Gatilho principal para quem anda em região de risco.
- Colisão e perda total: indenização de 100% da FIPE. Atenção: colisão com perda total é MAIS FREQUENTE que roubo, e o consultor deve lembrar o cliente disso, pois a maioria subestima esse risco.
- Incêndio e fenômenos da natureza: enchente, granizo, queda de árvore. Eventos que se tornaram comuns e que o cliente raramente considera.
- Assistência 24h: guincho, chaveiro, pane seca, troca de pneu, normalmente com abrangência nacional. É o benefício MAIS USADO no dia a dia, mesmo sem sinistro — ótimo para gerar percepção de valor logo no começo.

Regra de tradução: não recite cláusula, pinte o cenário. Em vez de "temos cobertura para perda total", diga: "se o seu carro for roubado amanhã, você recebe 100 por cento da FIPE — não fica no prejuízo nem sem o carro que usa para trabalhar."

== 4. A TABELA FIPE COMO FERRAMENTA DE VENDA ==
A FIPE é a referência de preço médio de veículos no Brasil. Quando você diz "indenização de 100 por cento da FIPE", está dizendo que, na perda total, o associado recebe o valor de mercado do carro dele — não um valor depreciado pela metade. Saber consultar a FIPE do veículo do cliente e citar o número exato ("seu carro hoje vale cerca de R$ X na FIPE") é uma das ferramentas de venda mais poderosas que existem, porque ancora a conversa no valor protegido.

== 5. CARÊNCIA: TRANSPARÊNCIA É PROTEÇÃO ==
Carência é o prazo após a adesão durante o qual algumas coberturas ainda não valem. Explique SEMPRE, com clareza. Isso evita a pior frustração possível: o associado acionar logo no início e descobrir que não estava coberto. Transparência aqui protege o cliente E a sua reputação como consultor.

== 6. ADAPTANDO AO PERFIL ==
CARRO: ticket maior, decisão mais racional, foco em patrimônio e família; bom argumento é o risco de seguir pagando o financiamento de um bem que deixou de existir.
MOTO: alto risco de roubo, decisão emocional e urgente, muitas vezes ferramenta de trabalho; bom argumento é a proteção da RENDA (ficar sem a moto é ficar sem ganhar).
USO: quem usa para trabalho valoriza agilidade e assistência; quem usa para lazer valoriza tranquilidade e rastreamento. Pergunte o uso ANTES de oferecer o plano.

== ESTUDO DE CASO ==
João, motorista de aplicativo, diz: "não preciso disso, nunca bati o carro". Em vez de discordar, o consultor pergunta: "João, e se amanhã alguém bater em você e o carro tiver perda total? Como você trabalharia sem o carro, e ainda pagando as prestações?". João pensa. O consultor mostra a FIPE do carro dele (R$ 45 mil) e a mensalidade equivalente a poucos reais por dia. João percebe que o risco real não era "bater", e sim "ficar sem renda". Fechou.

== ERROS QUE CUSTAM VENDAS ==
- Chamar proteção de "seguro".
- Omitir a carência.
- Listar coberturas em vez de traduzir benefícios.
- Oferecer plano antes de perguntar o uso.
- Insegurança ao explicar o produto.

== RESUMO (PONTOS-CHAVE) ==
1. Proteção veicular = mutualismo/rateio entre associados; não é seguro.
2. Aceitação ampla amplia o seu mercado.
3. 100 por cento da FIPE na perda total é o argumento de ancoragem.
4. Assistência 24h é o benefício de uso mais frequente.
5. Carência se explica sempre.
6. Adapte o discurso ao perfil e ao uso.

== PARA FIXAR (responda mentalmente) ==
1. Como você explicaria mutualismo para um cliente em 20 segundos?
2. Cite 3 vantagens da proteção frente ao seguro.
3. Por que a colisão com perda total é um argumento mais forte que o roubo?
4. Como a FIPE pode ser usada para ancorar valor?
5. Qual a pergunta que você deve fazer antes de oferecer um plano?', 0);
  end if;

  -- =========================================================
  -- MÓDULO 4 — Mentalidade e Rotina de Alta Performance
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 4 · Mentalidade e Rotina de Alta Performance';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Apostila 4 — Mentalidade e Rotina de Alta Performance (estudo completo)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Apostila 4 — Mentalidade e Rotina de Alta Performance (estudo completo)', 'Leitura de estudo · ~15 min',
'APOSTILA DO MÓDULO 4 — MENTALIDADE E ROTINA DE ALTA PERFORMANCE

== POR QUE ESTE MÓDULO IMPORTA ==
Dois consultores com o mesmo produto, o mesmo preço e a mesma região entregam resultados completamente diferentes. A diferença quase nunca está na sorte — está na MENTALIDADE e na ROTINA. Técnica sem disciplina não se sustenta; disciplina transforma técnica em resultado constante. Este módulo é sobre construir o profissional que entrega mês após mês.

== OBJETIVOS DE APRENDIZAGEM ==
1. Adotar a mentalidade de dono do próprio resultado.
2. Entender e medir o funil de vendas.
3. Planejar metas "de trás para frente".
4. Construir uma rotina diária produtiva (blocos de tempo + CRM).
5. Usar cada "não" como informação para melhorar.

== 1. MENTALIDADE DE DONO ==
Dono não terceiriza a culpa. Não foi o mercado, não foi o preço, não foi o cliente difícil. O dono pergunta: "o que EU posso fazer diferente?". Essa troca de foco — de vítima para protagonista — é o que separa quem cresce de quem reclama.

Três princípios sustentam essa mentalidade:
- Você é dono do resultado: atividade gera venda. Foque no que controla (quantas pessoas aborda, com que qualidade, com quanto follow-up).
- Constância vence talento: quem faz todos os dias, vende sempre. O jogo é de repetição e volume na base do funil.
- Foco no cliente, não na comissão: quem para de pensar na própria comissão e passa a resolver o problema do cliente vende mais. A comissão é consequência de servir bem.

Verdade incômoda: motivação acaba; disciplina permanece. Você não vai estar com vontade todos os dias. O profissional age pela rotina que construiu, não pela emoção do momento.

== 2. O FUNIL DE VENDAS ==
Contatos -> Conversas -> Cotações -> Vistorias -> Fechamentos. Cada etapa filtra para a próxima. Os números são SEUS; descubra os reais. Quando o resultado cai, o funil aponta a causa:
- Poucos contatos? Problema de prospecção (topo).
- Contatos não viram conversa? A abordagem inicial não engaja.
- Conversas não viram cotação? Falta diagnóstico.
- Cotações não fecham? Falta apresentação de valor ou fechamento.
Cada gargalo tem solução diferente. Sem o funil, você "tenta de tudo"; com ele, corrige o ponto certo.

== 3. METAS DE TRÁS PARA FRENTE ==
Esta habilidade transforma meta abstrata em plano concreto. Exemplo: quer 10 vendas no mês?
- Fecha 1 a cada 4 cotações -> precisa de 40 cotações.
- 1 a cada 2 conversas vira cotação -> 80 conversas.
- 1 a cada 3 contatos vira conversa -> ~240 contatos no mês -> ~12 por dia útil.
Pronto: "10 vendas" virou "12 abordagens por dia" — uma ação controlável.

KPIs do consultor: nº de abordagens/dia; taxa de conversa em cotação; taxa de cotação em fechamento; ticket médio e comissão.

== 4. A ROTINA DIÁRIA ==
- Reveja as metas do dia.
- Prepare scripts e materiais (FIPE, planos, argumentos).
- Separe a base de contatos do dia ANTES de começar.
- Trabalhe em blocos: prospecção de manhã (energia alta para o mais difícil), follow-ups e cotações à tarde, organização no fim do dia.
- Registre TUDO no CRM, com próximo passo e data. Sem CRM, você perde vendas que já estavam quase fechando.
- A maior parte das vendas acontece no FOLLOW-UP, não no primeiro contato. "Vou pensar" não é "não", é "ainda não". Agende o retorno e cumpra.

== 5. APRENDER COM O "NÃO" ==
Cada "não" carrega informação: foi timing, preço, falta de confiança ou pessoa errada? O consultor de elite transforma rejeição em ajuste; o mediano transforma rejeição em desânimo. Ao fim do dia, registre: quantas abordagens fez, qual objeção mais apareceu, o que vai ajustar amanhã. Em 30 dias você terá um diagnóstico do seu próprio jogo.

== ESTUDO DE CASO ==
Marcos começou o mês desanimado: "o mercado está fraco". Em vez de aceitar, mediu o funil: fazia só 4 abordagens por dia. Subiu para 12, manteve a mesma taxa de conversão e, no fim do mês, triplicou as vendas. O mercado era o mesmo; a atividade, não.

== ERROS QUE CUSTAM VENDAS ==
- Trabalhar por impulso, sem rotina.
- Não medir o funil.
- Não registrar contatos (perder follow-ups).
- Desistir cedo demais do follow-up.
- Culpar fatores externos em vez de ajustar a própria ação.

== RESUMO (PONTOS-CHAVE) ==
1. Você é dono do resultado; atividade gera venda.
2. Constância vence talento.
3. O funil mostra onde corrigir.
4. Planeje metas de trás para frente.
5. Rotina + CRM + follow-up = resultado constante.
6. Cada "não" é informação.

== PARA FIXAR ==
1. Quais são as etapas do funil, na ordem?
2. Como transformar uma meta de vendas em meta de atividade diária?
3. Por que o follow-up é tão decisivo?
4. O que registrar ao fim de cada dia?
5. Qual a diferença entre mentalidade de dono e mentalidade de vítima?', 0);
  end if;

  -- =========================================================
  -- MÓDULO 5 — Prospecção e Abordagem
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 5 · Prospecção e Abordagem';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Apostila 5 — Prospecção e Abordagem (estudo completo)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Apostila 5 — Prospecção e Abordagem (estudo completo)', 'Leitura de estudo · ~15 min',
'APOSTILA DO MÓDULO 5 — PROSPECÇÃO E ABORDAGEM

== POR QUE ESTE MÓDULO IMPORTA ==
Ninguém fecha o que não prospectou. A prospecção é a atividade que mais separa o consultor que bate meta do que vive no sufoco. Sem topo de funil constante, não há venda — por melhor que seja a sua técnica de fechamento. Este módulo ensina de onde vêm os clientes e como iniciar a conversa do jeito certo.

== OBJETIVOS DE APRENDIZAGEM ==
1. Conhecer e combinar os principais canais de prospecção.
2. Diferenciar prospecção ativa e passiva.
3. Dominar a abordagem no sinaleiro (captar, não vender).
4. Dominar a abordagem por WhatsApp (velocidade e contexto).
5. Construir um sistema de prospecção previsível.

== 1. OS CANAIS DE PROSPECÇÃO ==
- INDICAÇÃO (a rainha da conversão): cliente indicado já vem com confiança emprestada; a taxa de fechamento é muito maior. Peça SEMPRE, principalmente no pós-venda.
- PONTOS DE FLUXO / SINALEIRO: abordagem rápida para captar contato. Volume alto, conversão por contato menor; alimenta o topo do funil com gente nova.
- REDES SOCIAIS E WHATSAPP: conteúdo que educa atrai; resposta ágil converte. O WhatsApp tem taxa de abertura próxima de 99 por cento — dificilmente ignorado.
- PARCERIAS: oficinas, lava-rápidos, autopeças, despachantes, grupos de motoristas de app. Locais onde o seu cliente já está; geram fluxo recorrente.

== 2. ATIVA x PASSIVA ==
Ativa = você procura o lead (sinaleiro, parcerias, listas). Passiva = o lead chega por conteúdo ou indicação. O consultor de resultado combina as duas e nunca depende só de quem aparece. Depender de um único canal é frágil; se um seca, os outros sustentam.

== 3. ABORDAGEM NO SINALEIRO ==
O erro que mata: tentar vender ali. Você tem segundos e a pessoa está de passagem. O objetivo é CAPTAR O CONTATO para um atendimento consultivo depois.
SCRIPT (15 a 30 segundos): "Bom dia! Tudo bem? Sou consultor da Todos Protegidos. Trabalho com proteção pro seu carro/moto, com assistência 24h e indenização pela FIPE. Posso te mandar uma cotação rápida no WhatsApp, sem compromisso? Qual o seu melhor número?"
Regras: sorria e seja breve; não discuta preço no sinal; anote o contato E o modelo/ano do veículo.

== 4. ABORDAGEM POR WHATSAPP ==
Os primeiros minutos valem ouro: lead respondido em minutos converte muito mais que o mesmo lead horas depois.
SCRIPT (primeiro contato): "Oi, [nome]! Aqui é o [seu nome], da Todos Protegidos. Foi ótimo falar com você agora há pouco. Pra eu montar a sua cotação certinha, o seu carro é o [modelo/ano]? Em 1 minutinho te passo o valor e o que está incluso."
Princípios:
- Abra com CONTEXTO (como chegou até a pessoa). Mensagem genérica é ignorada.
- Uma pergunta por vez; conduza para a cotação, não para um papo solto.
- Áudios curtos (até ~40 segundos), claros, criam conexão; use texto quando o cliente preferir ler.
- Evite paredes de texto; profissionalismo na escrita.

== 5. O SISTEMA DE PROSPECÇÃO PREVISÍVEL ==
Prospecção amadora depende de humor; profissional é conta. Sabendo a sua taxa e a sua meta, "8 vendas" vira "~10 contatos novos por dia". Execute todo dia, diversifique os canais, registre cada lead no CRM com próximo passo, e peça indicação no pós-venda. A maioria das vendas exige VÁRIOS contatos — tenha modelos prontos (1ª abordagem, follow-up curto, convite para cotação/vistoria) e agende cada retorno.

== ESTUDO DE CASO ==
Ana só atendia quem chegava pelo Instagram — uns dias bons, outros vazios. Passou a reservar 1 hora de manhã para prospecção ativa (sinaleiro + parceria com um lava-rápido) e a pedir 2 indicações por cliente fechado. Em 60 dias, o fluxo deixou de oscilar: o topo do funil ficou cheio todos os dias.

== ERROS QUE CUSTAM VENDAS ==
- Esperar o cliente aparecer (prospecção passiva apenas).
- Tentar vender no sinaleiro.
- Demorar para responder no WhatsApp.
- Abrir mensagem sem contexto.
- Não pedir indicação.

== RESUMO (PONTOS-CHAVE) ==
1. Sem topo de funil, não há venda.
2. Indicação converte mais; peça sempre.
3. No sinaleiro, capte o contato — não venda.
4. No WhatsApp, velocidade e contexto.
5. Prospecção é diária, em volume e diversificada.

== PARA FIXAR ==
1. Qual canal costuma ter a maior conversão e por quê?
2. Qual o objetivo real da abordagem no sinaleiro?
3. Por que abrir a mensagem com contexto?
4. Como transformar a sua meta em número de contatos por dia?
5. Quando e como pedir indicação?', 0);
  end if;

  -- =========================================================
  -- MÓDULO 6 — Diagnóstico com SPIN Selling
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 6 · Diagnóstico com SPIN Selling';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Apostila 6 — Diagnóstico com SPIN Selling (estudo completo)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Apostila 6 — Diagnóstico com SPIN Selling (estudo completo)', 'Leitura de estudo · ~15 min',
'APOSTILA DO MÓDULO 6 — DIAGNÓSTICO COM SPIN SELLING

== POR QUE ESTE MÓDULO IMPORTA ==
A venda consultiva inverte a lógica do vendedor tradicional: em vez de despejar características, você faz PERGUNTAS que levam o próprio cliente a perceber a necessidade. Quando é o cliente quem conclui que precisa, a resistência cai. O SPIN é o método, nascido de pesquisa real (Neil Rackham analisou cerca de 35.000 ligações de vendas), que organiza essas perguntas.

== OBJETIVOS DE APRENDIZAGEM ==
1. Entender por que perguntar vende mais que argumentar.
2. Dominar as 4 etapas: Situação, Problema, Implicação, Necessidade.
3. Aplicar o SPIN na proteção veicular, passo a passo.
4. Usar a escuta ativa e o silêncio a seu favor.
5. Conduzir do diagnóstico para a apresentação sem empurrar.

== 1. POR QUE A PERGUNTA VENCE O ARGUMENTO ==
Quando você AFIRMA ("você precisa de proteção"), é a sua opinião contra a do cliente — ele pode discordar. Quando você PERGUNTA e ele CONCLUI ("é, se acontecer algo eu ficaria mal"), a conclusão é dele, e ninguém discute com a própria conclusão. Perguntar transfere a descoberta para o cliente.

== 2. AS 4 ETAPAS DO SPIN ==
SITUAÇÃO — entender o contexto, sem pressionar. "Qual veículo você tem e como usa no dia a dia?". Cuidado: não exagere, ou vira interrogatório. Colete o essencial e avance.
PROBLEMA — revelar a dor. "Hoje você tem alguma proteção? Já passou perrengue com guincho? Te preocupa ficar sem o carro?". Aqui o cliente começa a admitir um risco real.
IMPLICAÇÃO — ampliar a consciência da dor. Esta é a etapa MAIS PODEROSA e a mais ignorada. "Se o carro fosse roubado amanhã, como ficaria o seu trabalho? E o financiamento, continuaria correndo?". A implicação transforma um risco abstrato em um cenário concreto e desconfortável — e é esse desconforto saudável que cria a urgência.
NECESSIDADE DE SOLUÇÃO (NEED-PAYOFF) — o cliente verbaliza o ganho. "Ter 100 por cento da FIPE e assistência 24h resolveria essa preocupação?". Quando o cliente responde "sim, faria diferença", ele praticamente se vendeu sozinho.

== 3. A ESCADA EMOCIONAL ==
Situação é neutra; Problema desperta atenção; Implicação gera desconforto produtivo; Necessidade transforma esse desconforto em desejo de solução. Você conduz o cliente do "está tudo bem" ao "preciso resolver isso". Quem para no Problema e pula para a oferta perde a virada; a virada mora na Implicação.

== 4. ESCUTA ATIVA E SILÊNCIO ==
Perguntar sem ouvir é pior que não perguntar. Demonstre escuta: repita o que o cliente disse ("então o carro é essencial pro seu trabalho..."), valide o sentimento e use as PALAVRAS DELE na apresentação. E respeite o silêncio: depois de uma boa pergunta de implicação, cale-se — o silêncio deixa o cliente pensar e responder com profundidade.

== 5. ROTEIRO SPIN NA PROTEÇÃO VEICULAR ==
1) "Me conta: qual o veículo e pra que você mais usa ele?" (Situação)
2) "Você já tem proteção hoje? O que mais te preocupa em ficar sem?" (Problema)
3) "Imagina um roubo ou perda total sem cobertura — qual seria o impacto no seu bolso e na rotina?" (Implicação)
4) "Então, ter 100 por cento da FIPE e guincho 24h resolveria isso, certo?" (Necessidade)
Depois da etapa 4, o cliente JÁ QUER a solução. Aí você apresenta o plano, conectando cada cobertura à dor que ELE revelou.

== ÉTICA ==
SPIN não é manipulação. A diferença é a intenção: você não inventa um problema falso, ajuda o cliente a enxergar um risco real que ele subestimava. Se a proteção faz sentido para ele, conduzi-lo a perceber isso é um serviço.

== ESTUDO DE CASO ==
Cliente: "tá, mas eu dirijo há 15 anos sem problema". Consultor (Implicação): "que bom! E justamente por rodar tanto, qual seria o impacto se um dia, fora da sua mão, alguém causasse uma perda total? Você ficaria sem o carro e com o prejuízo?". Cliente (Necessidade, dito por ele): "é... ia me atrapalhar bastante". A venda destravou na implicação.

== ERROS QUE CUSTAM VENDAS ==
- Apresentar a solução antes de entender a dor.
- Pular a implicação e ir direto ao preço.
- Falar mais que o cliente.
- Fazer perguntas como interrogatório frio.

== RESUMO (PONTOS-CHAVE) ==
1. Pergunte mais, afirme menos.
2. Situação -> Problema -> Implicação -> Necessidade.
3. A Implicação cria a urgência.
4. Use as palavras do cliente; respeite o silêncio.
5. Só apresente o plano depois do diagnóstico.

== PARA FIXAR ==
1. O que significa cada letra de SPIN?
2. Por que a Implicação é a etapa-chave?
3. Dê um exemplo de pergunta de Necessidade para proteção veicular.
4. Qual o risco de fazer perguntas de Situação em excesso?
5. Por que o silêncio é uma ferramenta?', 0);
  end if;

  -- =========================================================
  -- MÓDULO 7 — Apresentação de Valor (Challenger)
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 7 · Apresentação de Valor (Challenger)';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Apostila 7 — Apresentação de Valor / Challenger (estudo completo)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Apostila 7 — Apresentação de Valor / Challenger (estudo completo)', 'Leitura de estudo · ~15 min',
'APOSTILA DO MÓDULO 7 — APRESENTAÇÃO DE VALOR (CHALLENGER)

== POR QUE ESTE MÓDULO IMPORTA ==
O consultor que só sabe competir por preço está sempre à beira de perder a venda para alguém mais barato. A saída é vender VALOR. A abordagem Challenger mostra que os melhores vendedores não são os mais simpáticos nem os que mais descontam — são os que ENSINAM algo novo, PERSONALIZAM para a realidade do cliente e ASSUMEM O CONTROLE da conversa com firmeza.

== OBJETIVOS DE APRENDIZAGEM ==
1. Aplicar os 3 pilares do Challenger (Ensinar, Personalizar, Assumir o controle).
2. Construir e comunicar valor antes de falar de preço.
3. Usar a ancoragem no risco evitado.
4. Estruturar uma apresentação que conecta tudo à dor do cliente.
5. Falar de preço com firmeza.

== 1. OS 3 PILARES (3 Ts) ==
ENSINAR (Teach): trazer um insight de mercado que o cliente não tinha — geralmente revelando um risco que ele subestimava. Ensinar gera AUTORIDADE e te diferencia do vendedor comum.
PERSONALIZAR (Tailor): adaptar a mensagem e a solução ao que mais preocupa AQUELE cliente (uso, região, veículo, profissão). Discurso genérico converte pouco; personalizado converte muito.
ASSUMIR O CONTROLE (Take control): conduzir o processo com firmeza, manter o ritmo e não deixar a negociação se arrastar — inclusive falando de preço com naturalidade. Não é ser grosseiro; é demonstrar domínio tranquilo.

== 2. ENSINAR O RISCO QUE O CLIENTE NÃO VÊ ==
A maioria das pessoas tem percepção distorcida de risco. Você agrega valor ao corrigi-la com fatos:
- "A maioria acha que roubo é o maior risco, mas batida com perda total é mais frequente e costuma ser mais cara."
- "Sem proteção, o prejuízo não é só o carro: é ficar sem trabalhar E ainda pagar o financiamento de um bem que não existe mais."
- "Enchente e granizo viraram comuns — e quase ninguém pensa nisso até acontecer."
Esse tipo de informação reposiciona a conversa: você deixa de ser "mais um vendedor" e vira um consultor que abriu os olhos do cliente.

== 3. PREÇO x VALOR E ANCORAGEM ==
O cliente compara, mesmo sem perceber, o benefício percebido contra o custo percebido. Se o benefício parece pequeno, qualquer preço parece caro. Seu trabalho não é baixar o custo — é elevar o benefício percebido.
ANCORAGEM: antes de falar da mensalidade, ancore na dimensão do que está protegido. "Quanto custaria repor o seu carro hoje? A FIPE dele é cerca de R$ X. A proteção custa o equivalente a centavos por dia disso." Sem âncora, a mensalidade é comparada com zero e perde; com âncora, parece pequena diante do risco.
TANGIBILIZE: compare a mensalidade com um gasto cotidiano ("menos que um streaming"). E use PROVA: casos reais convencem mais que adjetivos.

== 4. A APRESENTAÇÃO QUE CONECTA TUDO ==
A apresentação devolve ao cliente, em forma de solução, a dor que ele revelou. Estrutura: (1) recapitule a dor com as palavras dele; (2) apresente a solução conectada a essa dor; (3) ancore o valor (FIPE/risco); (4) reforce a assistência; (5) apresente a mensalidade já comparada; (6) conduza ao próximo passo.
SCRIPT: "Pelo que você me contou, o que mais pesa é [dor]. O nosso plano resolve assim: [cobertura ligada à dor]. Em caso de perda total ou roubo, você recebe 100 por cento da FIPE — hoje cerca de R$ [valor]. E tem guincho 24h, pra você nunca ficar na mão. Tudo isso por R$ [mensalidade], menos que [comparação cotidiana]. Faz sentido pra você?"

== 5. FIRMEZA NO PREÇO ==
Acredite no que vende. Se você hesita ou pede desculpas ao dizer o valor, transmite que nem você acha que vale. Diga o preço com naturalidade, logo após construir o valor. E lembre: quando o cliente insiste no preço, quase sempre é sinal de valor insuficiente percebido — volte e reforce o valor, não corte o preço.

== ESTUDO DE CASO ==
Cliente compara com um concorrente R$ 10 mais barato. Em vez de baixar, o consultor ensina: "entendo. Posso te mostrar uma coisa? Muita gente compara só a mensalidade e esquece o principal: o que acontece na hora do problema. Veja o que está incluso aqui [assistência, FIPE, atendimento]. R$ 10 a menos não compensa ficar descoberto no momento que mais importa." Fechou pelo valor.

== ERROS QUE CUSTAM VENDAS ==
- Começar pelo preço.
- Brigar por preço em vez de reposicionar para valor.
- Dar desconto antes de o cliente pedir.
- Apresentar o plano sem conectar à dor.
- Hesitar ao falar o valor.

== RESUMO (PONTOS-CHAVE) ==
1. Ensinar, Personalizar, Assumir o controle.
2. Eleve o benefício percebido em vez de baixar preço.
3. Ancore no risco evitado antes de precificar.
4. Conecte cada cobertura à dor do cliente.
5. Fale o preço com firmeza.

== PARA FIXAR ==
1. Quais são os 3 pilares do Challenger?
2. O que é ancoragem e por que ela funciona?
3. Cite um insight que "ensina" o cliente de proteção veicular.
4. Qual a ordem correta: preço ou valor primeiro? Por quê?
5. O que fazer quando o cliente insiste no preço?', 0);
  end if;

  -- =========================================================
  -- MÓDULO 8 — Fechamento e Tratamento de Objeções
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 8 · Fechamento e Tratamento de Objeções';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Apostila 8 — Fechamento e Objeções (estudo completo)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Apostila 8 — Fechamento e Objeções (estudo completo)', 'Leitura de estudo · ~15 min',
'APOSTILA DO MÓDULO 8 — FECHAMENTO E TRATAMENTO DE OBJEÇÕES

== POR QUE ESTE MÓDULO IMPORTA ==
Muito atendimento bom morre na hora decisiva por dois motivos: o consultor não PEDE a venda, ou não sabe tratar uma objeção. Fechar é conduzir o cliente à decisão com naturalidade — e isso é responsabilidade sua. Objeção, por sua vez, raramente é "não": é dúvida, e dúvida bem tratada vira fechamento.

== OBJETIVOS DE APRENDIZAGEM ==
1. Aplicar técnicas de fechamento sem pressão.
2. Entender que objeção é sinal de dúvida (e de interesse).
3. Usar a estrutura Empatia -> Valor -> Recondução.
4. Responder às objeções clássicas com scripts.
5. Reconduzir sempre ao próximo passo.

== 1. QUEM NÃO PEDE, NÃO FECHA ==
O erro mais comum é não pedir a venda. Use a PERGUNTA DE CONTINUIDADE em vez do constrangedor "quer fechar?": "Pra já deixar a sua proteção ativa hoje, vou precisar confirmar alguns dados, tudo bem?". Ela presume o avanço de forma leve.
Outras técnicas:
- Fechamento por alternativa: "Prefere começar no plano Essencial ou no Total?" — qualquer resposta avança.
- Resumo de valor + próximo passo: recapitule o ganho e direcione para a vistoria.
- Escassez REAL (nunca falsa): se houver uma condição com prazo verdadeiro, use-a.
Postura: peça com naturalidade e, após a pergunta de fechamento, CALE-SE. Quem fala primeiro depois do fechamento costuma comprar de volta a própria venda.

== 2. OBJEÇÃO É DÚVIDA, NÃO REJEIÇÃO ==
Objeção quase sempre significa "ainda tenho um receio que você não resolveu" — e é sinal de INTERESSE, porque quem não tem interesse encerra. Encare a objeção como um pedido de ajuda disfarçado.

== 3. A ESTRUTURA UNIVERSAL ==
EMPATIA -> VALOR -> RECONDUÇÃO.
1) Empatia: valide o sentimento sem brigar ("entendo", "faz sentido pensar nisso"). Isso baixa a guarda.
2) Valor: traga a informação, o benefício ou a comparação que dissolve a dúvida.
3) Recondução: uma pergunta ou direcionamento que volta ao fechamento. Tratar e não reconduzir é deixar a venda morrer no ar.

== 4. OS CLÁSSICOS, COM SCRIPT ==
"ESTÁ CARO" (pedido de justificativa de valor): "Entendo. Caro comparado a quê? Veja: por R$ [x] por dia você protege um bem de R$ [FIPE] e ainda tem guincho 24h. O caro de verdade é ter um prejuízo total e ficar sem o carro e sem indenização. Faz sentido garantir essa tranquilidade hoje?"
"VOU PENSAR" (esconde outra objeção): "Claro, é decisão importante. Só pra eu te ajudar melhor: o que ainda falta ficar claro — é a cobertura, o valor ou a forma de ativar?". Descubra a dúvida real, trate-a e MARQUE UM RETORNO com data.
"JÁ TENHO SEGURO/PROTEÇÃO" (informe sem depreciar): "Que bom que você se preocupa. A proteção veicular funciona por rateio entre associados; o seguro é regulado pela SUSEP. Posso te mostrar onde a proteção costuma sair mais em conta e com menos burocracia? Sem compromisso."
"PRECISO FALAR COM MEU/MINHA CÔNJUGE": "Perfeito, decisão de casa se decide junto. Quer que eu te passe um resumo do que está incluso pra facilitar a conversa?". Agende retorno com data.

== 5. A PSICOLOGIA POR TRÁS ==
As pessoas decidem pela emoção e justificam pela razão. Use a aversão à perda de forma ética (foque no que o cliente EVITA perder). Mostre o custo da indecisão com elegância ("enquanto a gente adia, o carro segue sem proteção"). E construa pequenos "sins" ao longo do atendimento: eles tornam o "sim" final coerente.

== ESTUDO DE CASO ==
"Vou pensar." O consultor: "claro! Só me ajuda: é o valor, a cobertura ou a forma de ativar que ainda gera dúvida?". Cliente: "é o valor". O consultor reposiciona com a FIPE e um gasto cotidiano, e fecha por alternativa: "começamos no Essencial ou no Total?". O "vou pensar" era, na verdade, uma objeção de valor não dita.

== ERROS QUE CUSTAM VENDAS ==
- Não pedir a venda.
- Tratar o cliente como adversário.
- Baixar o preço no primeiro "está caro".
- Aceitar o "vou pensar" e sumir.
- Tratar a objeção e não reconduzir.

== RESUMO (PONTOS-CHAVE) ==
1. Quem não pede, não fecha.
2. Objeção é dúvida e sinal de interesse.
3. Empatia -> Valor -> Recondução.
4. "Vou pensar" esconde outra objeção; investigue.
5. Toda objeção tratada termina em recondução.

== PARA FIXAR ==
1. O que é a pergunta de continuidade?
2. Qual a estrutura para tratar qualquer objeção?
3. Como responder a "está caro" sem baixar o preço?
4. O que costuma esconder o "vou pensar"?
5. Por que reconduzir é indispensável?', 0);
  end if;

  -- =========================================================
  -- MÓDULO 9 — Vistoria, Pós-venda e Retenção
  -- =========================================================
  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 9 · Vistoria, Pós-venda e Retenção';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Apostila 9 — Vistoria, Pós-venda e Retenção (estudo completo)') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Apostila 9 — Vistoria, Pós-venda e Retenção (estudo completo)', 'Leitura de estudo · ~15 min',
'APOSTILA DO MÓDULO 9 — VISTORIA, PÓS-VENDA E RETENÇÃO

== POR QUE ESTE MÓDULO IMPORTA ==
A venda só está completa quando a proteção está ATIVA — e a relação só começa aí. Uma vistoria malfeita atrasa ou recusa a ativação e derruba vendas já fechadas. E o pós-venda, a etapa mais negligenciada, é a mais lucrativa: reter custa muito menos que conquistar, e cliente satisfeito indica. Este módulo fecha o ciclo: ativar, encantar e fidelizar.

== OBJETIVOS DE APRENDIZAGEM ==
1. Executar uma vistoria sem erros.
2. Alinhar expectativas (carência) na ativação.
3. Fazer um pós-venda que gera indicação e recompra.
4. Pedir indicação de forma eficaz.
5. Reter a carteira com presença ativa.

== 1. PROTOCOLO DE VISTORIA ==
Checklist de fotos: frente, traseira e as duas laterais; painel com o hodômetro visível; número do chassi; pneus e estado geral; documento do veículo no formato exigido (em muitos apps, somente foto/JPG — PDF costuma NÃO ser aceito). Fotos nítidas, com boa luz e placa legível, evitam recusa e retrabalho.
Antes de enviar: confira os dados do associado e do veículo (um erro de digitação trava tudo); anote avarias preexistentes (protege o associado e a associação); revise as fotos uma a uma.
Vistoria bem feita = ativação rápida = cliente seguro. Vistoria relapsa = retrabalho, atraso e um associado começando a relação desconfiado.

== 2. ALINHAR A CARÊNCIA ==
No momento da ativação, reforce o que é a carência e quando cada cobertura passa a valer. Esse alinhamento evita a pior frustração: acionar nos primeiros dias e descobrir que ainda não estava coberto. Transparência aqui sustenta a confiança construída na venda.

== 3. A ECONOMIA DA RETENÇÃO ==
Conquistar um cliente novo custa de 5 a 25 vezes mais que reter um atual; aumentar a retenção em torno de 5 por cento eleva o lucro de forma expressiva. Toda etapa após a venda também é venda (entrega, atendimento, renovação, indicação). Cliente fiel gasta mais e indica mais — e a indicação vem com confiança embutida, convertendo mais que qualquer anúncio. A carteira é o seu patrimônio.

== 4. PÓS-VENDA QUE RENDE ==
Script de boas-vindas (logo após a ativação): "[nome], a sua proteção está ativa! Salva o meu contato — qualquer necessidade de guincho, assistência ou dúvida, fala comigo direto que eu te oriento. E se você conhecer alguém que também ia querer essa tranquilidade, a sua indicação vale muito pra mim."
Esse contato confirma a ativação, posiciona você como suporte (não some após vender) e planta a semente da indicação. IMPORTANTE: oriente sempre os canais corretos — 0800 da Central para assistência 24h e sinistro; Setor de Eventos para eventos já em andamento (colisão, roubo, furto, indenização).

== 5. INDICAÇÃO E REATIVAÇÃO ==
Peça indicação com o cliente satisfeito, de forma específica e fácil: "me indica duas pessoas que andam de carro ou moto e que você acha que iam gostar de ficar protegidas?". Pedido vago rende pouco; específico rende contatos.
Reativação de ex-associado (lead quente, já conhece o valor): use condição real quando houver (ex.: isenção da 2a mensalidade): "[nome], preparei uma condição especial pra você voltar a ficar protegido: isenção da 2a mensalidade. Posso reativar hoje?"

== 6. RETENÇÃO ATIVA ==
Contato periódico (não só quando vai vender), lembrete de como acionar a assistência, e presença no momento de necessidade. A fidelidade nasce nos momentos de aperto: o associado bem orientado num guincho à noite lembra disso para sempre e dificilmente troca por R$ 5 a menos.

== ESTUDO DE CASO ==
Pedro ativava e sumia. Passou a mandar a mensagem de boas-vindas no mesmo dia, um check-in após 3 semanas e a pedir 2 indicações por cliente satisfeito. Em três meses, metade das suas novas vendas vinha de indicações da própria carteira — com esforço de prospecção muito menor.

== ERROS QUE CUSTAM VENDAS ==
- Vistoria com fotos ruins (recusa/atraso).
- Não explicar a carência.
- Sumir após a venda.
- Não pedir indicação.
- Orientar o cliente pelo canal errado em vez de 0800 / Setor de Eventos.

== RESUMO (PONTOS-CHAVE) ==
1. Vistoria bem feita = ativação rápida.
2. Carência se alinha na ativação.
3. Reter custa muito menos que conquistar.
4. Pós-venda ativo gera indicação e recompra.
5. Indique os canais corretos (0800 / Setor de Eventos).

== PARA FIXAR ==
1. Quais fotos são essenciais na vistoria?
2. Por que alinhar a carência na ativação?
3. Por que a retenção é financeiramente tão vantajosa?
4. Como pedir indicação de forma eficaz?
5. Para onde encaminhar assistência/sinistro e eventos em andamento?', 0);
  end if;

  raise notice 'Apostila completa adicionada aos modulos de vendas (3 a 9).';
end $$;
