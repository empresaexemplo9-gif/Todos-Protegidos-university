-- ============================================================
-- TODOS PROTEGIDOS UNIVERSITY — Conteúdo APROFUNDADO da trilha
--
-- O que este script faz (seguro rodar mais de uma vez):
--  1) Reordena os módulos institucionais: "Palavra do Presidente" passa a ser
--     o Módulo 1 e "Filosofia e Cultura" o Módulo 2 (renumera as aulas).
--  2) Substitui as descrições das aulas de vendas por MATERIAL DE ESTUDO
--     completo e aprofundado (leitura), sem depender de videoaula.
--  3) Adiciona em cada módulo de vendas uma aula de "Leitura aprofundada".
--
-- Pré-requisito: já ter rodado schema.sql e conteudo.sql (tenant 'matriz').
-- Rode no SQL Editor do Supabase.
-- ============================================================
do $$
declare
  t uuid;
  m uuid;
begin
  select id into t from public.tenants where slug = 'matriz';
  if t is null then raise notice 'Tenant "matriz" nao encontrado.'; return; end if;

  -- =========================================================
  -- 1) REORDENAR INSTITUCIONAIS (Presidente 1º, Filosofia 2º)
  -- =========================================================
  update public.modulos set titulo = 'Módulo 1 · Palavra do Presidente', ordem = 1
   where tenant_id = t and titulo = 'Módulo 2 · Palavra do Presidente';
  update public.modulos set titulo = 'Módulo 2 · Filosofia e Cultura da Todos Protegidos', ordem = 2
   where tenant_id = t and titulo = 'Módulo 1 · Filosofia e Cultura da Todos Protegidos';

  -- renumera as aulas dos dois módulos (títulos completos são únicos)
  update public.itens set titulo = 'Aula 1.1 — Mensagem de boas-vindas do Presidente'
   where tenant_id = t and titulo = 'Aula 2.1 — Mensagem de boas-vindas do Presidente';
  update public.itens set titulo = 'Aula 1.2 — Nosso propósito e cultura'
   where tenant_id = t and titulo = 'Aula 2.2 — Nosso propósito e cultura';
  update public.itens set titulo = 'Aula 2.1 — Nossa história'
   where tenant_id = t and titulo = 'Aula 1.1 — Nossa história';
  update public.itens set titulo = 'Aula 2.2 — Missão'
   where tenant_id = t and titulo = 'Aula 1.2 — Missão';
  update public.itens set titulo = 'Aula 2.3 — Visão'
   where tenant_id = t and titulo = 'Aula 1.3 — Visão';
  update public.itens set titulo = 'Aula 2.4 — Valores'
   where tenant_id = t and titulo = 'Aula 1.4 — Valores';

  -- =========================================================
  -- 2) MÓDULO 3 — Fundamentos da Proteção Veicular
  -- =========================================================
  update public.itens set descricao =
'INTRODUÇÃO
Para vender com segurança, o consultor precisa primeiro entender em profundidade o que está vendendo. Proteção veicular não é seguro, e confundir os dois é o erro que mais derruba a confiança do cliente. Esta aula constrói a base conceitual de tudo o que vem depois.

O QUE É, DE FATO
A proteção veicular é um sistema de mutualismo: uma associação de pessoas que se unem e contribuem mensalmente para um fundo comum (rateio). Quando um associado sofre um prejuízo coberto — roubo, furto, colisão, perda total — esse fundo coletivo cobre o prejuízo. Ninguém "lucra" com a sua mensalidade da forma como uma seguradora lucra; o dinheiro é dos próprios associados, administrado pela associação para proteger todos.

POR QUE ISSO IMPORTA NA VENDA
Como não é seguro regulado pela SUSEP, a proteção veicular tem três vantagens práticas que o cliente sente no bolso e na vida:
1. Adesão simples: sem análise de perfil rígida e, em geral, sem consulta a score de crédito. Isso abre a porta para quem o seguro tradicional recusa ou cobra caro (jovem, carro antigo, profissional de app, histórico de sinistro).
2. Custo competitivo: como o modelo é de rateio e a burocracia é menor, a mensalidade costuma ser mais acessível.
3. Agilidade: menos etapas para aderir e para ser atendido.

O PAPEL DO CONSULTOR
Você é o elo de confiança. Sua função não é "empurrar" um produto, é traduzir um sistema de proteção para a realidade do cliente, com clareza e honestidade. Prometer o que não existe (por exemplo, "cobre tudo, sem carência") destrói a relação e gera cancelamento. Explicar bem constrói carteira fiel.

ROTEIRO DE FALA (90 segundos)
"Proteção veicular funciona como uma grande rede de motoristas que se ajudam: todos contribuem com um valor mensal e, quando alguém sofre um prejuízo, a rede cobre. Por ser uma associação, e não um seguro tradicional, conseguimos um custo menor, menos burocracia e adesão sem aquela análise pesada — com assistência 24 horas e indenização pela tabela FIPE em caso de perda total."

ERROS A EVITAR
- Dizer que "é a mesma coisa que seguro" (não é, e isso pode gerar problema).
- Omitir a existência de carência.
- Falar em termos técnicos sem traduzir o benefício.'
   where tenant_id = t and titulo = 'Aula 3.1 — O que é proteção veicular';

  update public.itens set descricao =
'OBJETIVO
Dominar o que está incluso para apresentar com firmeza e responder dúvidas sem hesitar. Cliente que percebe domínio confia; cliente que percebe insegurança recua.

COBERTURAS PADRÃO (e o que cada uma significa para o cliente)
- Roubo e furto: se levarem o veículo, o associado é indenizado. Para quem mora ou trabalha em região de risco, este é muitas vezes o gatilho principal.
- Colisão e perda total: em batida com perda total, a indenização é de 100% da tabela FIPE. Importante: a colisão com perda total é mais frequente que o roubo, e o consultor deve lembrar disso (a maioria das pessoas subestima esse risco).
- Incêndio e fenômenos da natureza: enchente, granizo, queda de árvore, alagamento. Eventos que viraram comuns e que o cliente raramente considera.
- Assistência 24h: guincho, chaveiro, pane seca, troca de pneu, muitas vezes com cobertura nacional. É o benefício que o cliente mais USA no dia a dia, mesmo sem sinistro — e por isso é ótimo para demonstrar valor logo no começo.

O QUE É A TABELA FIPE
A FIPE é a referência de preço médio de veículos no Brasil. Quando você diz "indenização de 100% da FIPE", está dizendo que, na perda total, o associado recebe o valor de mercado do carro dele — não um valor inventado nem depreciado pela metade. Saber consultar a FIPE do veículo do cliente e citar o número exato ("seu carro hoje vale cerca de R$ X na FIPE") é uma das ferramentas de venda mais poderosas que existem.

CARÊNCIA — FALE SEMPRE
Carência é o prazo após a adesão durante o qual algumas coberturas ainda não valem. Explicar isso de forma clara evita a pior frustração possível: o associado acionar logo no início e descobrir que não estava coberto. Transparência aqui é proteção para o cliente E para a sua reputação.

DICA DE VENDA — TRADUZIR COBERTURA EM TRANQUILIDADE
Não liste apólice; pinte o cenário. Em vez de "temos cobertura para perda total", diga: "Se o seu carro for roubado amanhã, você recebe 100% da FIPE — não fica no prejuízo nem sem o carro que usa para trabalhar e levar a família." Benefício sentido vende; cláusula técnica não.'
   where tenant_id = t and titulo = 'Aula 3.2 — Coberturas, FIPE e assistência 24h';

  update public.itens set descricao =
'POR QUE SEPARAR CARRO E MOTO
O produto é parecido, mas a pessoa, a dor e o ritmo da decisão mudam completamente. Atender os dois da mesma forma reduz a conversão. Adapte o discurso ao perfil.

PERFIL CARRO
- Ticket maior, decisão mais racional e, em geral, mais demorada (a pessoa pesa, compara, conversa com a família).
- A dor central é patrimônio e segurança da família. O carro costuma ser o segundo maior bem da pessoa, muitas vezes financiado.
- Argumento que funciona: o risco de continuar pagando um financiamento de um bem que deixou de existir (roubo/perda total sem cobertura). Esse cenário assusta e é real.
- Ritmo: dê espaço, mas conduza. Marque o próximo passo (cotação detalhada, vistoria) para não esfriar.

PERFIL MOTO
- Alto risco de roubo, decisão mais emocional e urgente. Muitas vezes a moto é a ferramenta de trabalho (entregador, mototaxista).
- A dor central é ficar sem renda. Para quem trabalha com a moto, um dia parado é dinheiro perdido.
- Argumento que funciona: rapidez para voltar a rodar — guincho, assistência e indenização ágil.
- Ritmo: mais rápido. O cliente de moto costuma decidir mais rápido quando enxerga proteção da renda.

ROTEIRO MOTO
"Para quem trabalha com a moto, ficar sem ela é ficar sem renda. A proteção garante que, se acontecer algo, você volta a rodar rápido — com guincho 24h e indenização pela FIPE se a moto for roubada. É proteger o seu ganha-pão, não só o veículo."

ROTEIRO CARRO
"Seu carro é um patrimônio importante — e provavelmente você ainda tem prestações a pagar. Pense no pior cenário: roubo ou perda total. Sem proteção, você ficaria sem o carro e ainda com a dívida. Com a proteção, recebe 100% da FIPE e segue tranquilo. É proteger a família de um prejuízo que pode desorganizar tudo."

REGRA DE OURO
Descubra o uso antes de falar de plano. "Como você usa o veículo no dia a dia?" abre a porta para o argumento certo.'
   where tenant_id = t and titulo = 'Aula 3.3 — Carro x Moto: particularidades';

  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 3 · Fundamentos da Proteção Veicular';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 3.4 — Leitura aprofundada: proteção x seguro na prática') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 3.4 — Leitura aprofundada: proteção x seguro na prática', 'Material de estudo',
'Este texto consolida tudo o que um consultor precisa saber para nunca mais travar diante de "qual a diferença para o seguro?".

1. NATUREZA JURÍDICA
O seguro é um contrato regulado pela SUSEP, vendido por seguradoras, com apólice e regras padronizadas. A proteção veicular é uma relação associativa: você adere a uma associação/cooperativa e participa de um rateio de prejuízos. Não há "apólice de seguro", há um regulamento da associação. Por isso o consultor nunca deve usar a palavra "seguro" como sinônimo — além de incorreto, pode gerar reclamação.

2. ANÁLISE DE RISCO E ACEITAÇÃO
A seguradora calcula prêmio com base em perfil, score, histórico, CEP, idade do condutor — e pode recusar. A proteção veicular tem aceitação mais ampla e simples. Isso significa que o seu público potencial é MAIOR: inclui quem foi recusado ou achou caro no seguro. Saber disso muda a sua prospecção.

3. CUSTO
Por ter menos custo administrativo e funcionar por rateio, a mensalidade costuma ser mais acessível. Mas atenção: nunca venda só por preço. Preço sozinho atrai o cliente que troca por qualquer centavo a menos. Venda valor (cobertura + assistência + atendimento humano).

4. INDENIZAÇÃO
Na perda total, o padrão é 100% da FIPE. No seguro, há modalidades (valor de mercado, valor determinado). Saber explicar a FIPE com o número real do carro do cliente é decisivo.

5. ASSISTÊNCIA 24H
Guincho, chaveiro, pane seca, troca de pneu — disponível desde o início (respeitada eventual carência). É o benefício de uso mais frequente e o melhor para gerar percepção de valor imediata.

6. CARÊNCIA
Existe e deve ser sempre explicada. Honestidade na carência evita cancelamento e protege a sua reputação de consultor.

RESUMO PARA LEVAR PARA O ATENDIMENTO
Proteção veicular = aceitação ampla + custo acessível + assistência 24h + 100% FIPE na perda total + adesão simples. Seguro = produto regulado, mais caro, com análise de risco. Posicione a proteção como a escolha inteligente para a maioria dos motoristas — sem atacar o seguro, apenas mostrando onde ela costuma sair na frente.', 4);
  end if;

  -- =========================================================
  -- 3) MÓDULO 4 — Mentalidade e Rotina de Alta Performance
  -- =========================================================
  update public.itens set descricao =
'A VENDA COMEÇA NA CABEÇA
Antes de qualquer técnica, vem a mentalidade. Dois consultores com o mesmo produto e o mesmo preço entregam resultados completamente diferentes — e a diferença quase sempre está em como cada um pensa e se organiza.

MENTALIDADE DE DONO
Dono não terceiriza a culpa. Não foi o mercado, não foi o preço, não foi o cliente "difícil". O dono pergunta: "o que EU posso fazer diferente?". Essa troca de foco — de vítima para protagonista — é o que separa quem cresce de quem reclama.

OS TRÊS PRINCÍPIOS
1. Você é dono do seu resultado: atividade gera venda. Resultado é consequência de ações controláveis (quantas pessoas você abordou, quantas cotações fez). Foque no que você controla.
2. Constância vence talento: o consultor mediano que prospecta todos os dias supera o "talentoso" que trabalha por impulso. Vendas é um jogo de repetição e volume na base do funil.
3. Foco no cliente, não na comissão: paradoxalmente, quem para de pensar na própria comissão e passa a resolver o problema do cliente vende mais. A comissão é resultado de servir bem.

O RITUAL DIÁRIO DO PROFISSIONAL
- Reveja suas metas do dia (quantos contatos, cotações, follow-ups).
- Prepare seus scripts e materiais (FIPE, planos, argumentos).
- Separe a base de contatos do dia ANTES de começar.
- Registre TUDO no CRM, com próximo passo e data.
- Faça uma autoanálise ao fim do dia: o que funcionou, o que travou.

A VERDADE INCÔMODA
Motivação acaba; disciplina permanece. Você não vai "estar com vontade" todos os dias. O profissional age pela rotina que construiu, não pela emoção do momento. É a disciplina que garante o resultado nos dias ruins.'
   where tenant_id = t and titulo = 'Aula 4.1 — Mentalidade de dono';

  update public.itens set descricao =
'O QUE NÃO SE MEDE NÃO SE MELHORA
Vender sem olhar números é dirigir com os olhos fechados. O funil é o mapa que mostra exatamente onde você ganha e onde você perde vendas.

O FUNIL DE VENDAS
Contatos → Conversas → Cotações → Vistorias → Fechamentos.
Cada etapa filtra para a próxima. De 100 contatos, talvez 40 viram conversa, 20 viram cotação, 8 vão para vistoria e 5 fecham. Esses números são SEUS — descubra os seus reais.

PLANEJAR DE TRÁS PARA FRENTE
Esta é a habilidade que transforma meta em plano. Quer 10 vendas no mês? Com a sua taxa atual:
- Se você fecha 1 a cada 4 cotações, precisa de 40 cotações.
- Se 1 a cada 2 conversas vira cotação, precisa de 80 conversas.
- Se 1 a cada 3 contatos vira conversa, precisa de ~240 contatos no mês, ou ~12 por dia útil.
Pronto: a meta abstrata "10 vendas" virou uma ação concreta e controlável: "12 abordagens por dia".

OS KPIS DO CONSULTOR
- Número de abordagens por dia (atividade — o que você mais controla).
- Taxa de conversa em cotação (qualidade da sua abordagem).
- Taxa de cotação em fechamento (qualidade do seu diagnóstico e fechamento).
- Ticket médio e comissão (valor por venda).

DIAGNÓSTICO PELO FUNIL
Quando o resultado cai, o funil mostra a causa:
- Poucos contatos? Problema de prospecção (topo do funil).
- Contatos viram conversa mas não cotação? Sua abordagem inicial não engaja.
- Cotações não fecham? Seu diagnóstico ou fechamento precisa melhorar.
Cada gargalo tem uma solução diferente. Sem o funil, você "tenta de tudo"; com ele, você corrige o ponto certo.'
   where tenant_id = t and titulo = 'Aula 4.2 — Metas e funil de vendas';

  update public.itens set descricao =
'TEMPO É A MATÉRIA-PRIMA DA VENDA
Todo consultor tem as mesmas 24 horas. O que muda é como cada um usa. Organização não é burocracia — é o que permite atender mais e esquecer menos oportunidades.

BLOCOS DE TEMPO (TIME BLOCKING)
Divida o dia em blocos com propósito:
- Manhã: prospecção e novos contatos (energia alta para o que é mais difícil).
- Início da tarde: cotações e follow-ups de quem já conversou.
- Fim da tarde: registros, organização do dia seguinte, recuperação de contatos frios.
Evite o erro clássico de ficar o dia inteiro "reagindo" ao WhatsApp sem nunca prospectar ativamente.

O CRM É O SEU DINHEIRO ORGANIZADO
Cada contato deve virar um registro com: nome, veículo, etapa do funil, próximo passo e DATA do próximo passo. Sem isso, você perde vendas que já estavam quase fechando — simplesmente porque esqueceu de retornar. A maioria das vendas acontece no follow-up, não no primeiro contato.

A REGRA DO FOLLOW-UP
Um "vou pensar" não é um "não". É um "ainda não". O consultor organizado agenda o retorno e cumpre. Pesquisas de vendas mostram que a maior parte dos negócios exige vários contatos — e a maioria dos vendedores desiste cedo demais. Quem faz o follow-up disciplinado colhe o que os outros abandonaram.

CHECKLIST DE ORGANIZAÇÃO
- Todo lead novo entra no CRM no mesmo dia.
- Todo atendimento termina com um próximo passo agendado.
- Todo dia começa revisando os follow-ups vencidos.
- Nada importante mora só na sua memória ou em um caderno solto.'
   where tenant_id = t and titulo = 'Aula 4.3 — Gestão do tempo e CRM';

  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 4 · Mentalidade e Rotina de Alta Performance';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 4.4 — Leitura aprofundada: a rotina do consultor de elite') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 4.4 — Leitura aprofundada: a rotina do consultor de elite', 'Material de estudo',
'Os melhores consultores não são os mais "talentosos" — são os mais consistentes. Este material descreve a rotina que sustenta resultado mês após mês.

1. O PRINCÍPIO DA ATIVIDADE CONTROLÁVEL
Você não controla quem compra. Você controla quantas pessoas aborda, com que qualidade e com quanto follow-up. Foque obsessivamente nesses inputs. Resultado é a sombra da atividade: cuide da atividade e o resultado segue.

2. A MATEMÁTICA DA CONSTÂNCIA
Imagine dois consultores. O primeiro faz 5 abordagens em dias de "vontade", umas 12 por semana. O segundo faz 10 por dia, todo dia útil — 50 por semana. Em um mês, o segundo teve 4x mais oportunidades. Mesmo com taxa de conversão menor, ele vende muito mais. Volume constante vence picos de inspiração.

3. AS QUATRO ALAVANCAS DE RESULTADO
- Mais atividade (prospectar mais).
- Melhor conversão (técnica de abordagem, diagnóstico e fechamento).
- Maior ticket (vender o plano certo, não o mais barato).
- Mais recompra/indicação (pós-venda e carteira).
Trabalhe uma alavanca por vez. Tentar tudo ao mesmo tempo dispersa.

4. O DIÁRIO DE BORDO
Ao fim do dia, registre 3 coisas: quantas abordagens fez, qual objeção mais apareceu, e o que vai ajustar amanhã. Em 30 dias você terá um diagnóstico preciso do seu próprio jogo — algo que nenhum treinamento entrega pronto.

5. ENERGIA E PROFISSIONALISMO
Cuide do básico: sono, alimentação, pausas. Atendimento é energia transmitida. Cliente sente entusiasmo e sente cansaço. Trate a sua energia como ferramenta de trabalho.

6. A MENTALIDADE ANTIFRÁGIL
Cada "não" carrega informação. Pergunte-se: foi timing, foi preço, foi falta de confiança, foi a pessoa errada? O consultor de elite transforma rejeição em ajuste. O mediano transforma rejeição em desânimo. A diferença, ao longo de um ano, é gigante.

RESUMO
Disciplina diária + medição do funil + foco no cliente + aprendizado com cada não = carreira sólida. Talento ajuda; constância é o que paga as contas.', 4);
  end if;

  -- =========================================================
  -- 4) MÓDULO 5 — Prospecção e Abordagem
  -- =========================================================
  update public.itens set descricao =
'SEM TOPO DE FUNIL, NÃO HÁ VENDA
Prospecção é a atividade que mais separa o consultor que bate meta do que vive "no sufoco". Ninguém fecha o que não prospectou. Esta aula mapeia de onde vêm os clientes e como alimentar o funil todos os dias.

OS PRINCIPAIS CANAIS

1. INDICAÇÃO (a rainha da conversão)
Cliente indicado já vem com confiança emprestada por quem indicou. A taxa de fechamento é muito maior. Por isso: peça indicação SEMPRE, principalmente no pós-venda, com o cliente satisfeito. "Conhece alguém que também ia querer ficar protegido?" Um pedido simples, repetido, constrói uma máquina de leads gratuita.

2. PONTOS DE FLUXO / SINALEIRO
Abordagem rápida em locais de movimento para captar contato (não para vender ali). Volume alto, conversão por contato menor, mas alimenta o topo do funil com gente nova.

3. REDES SOCIAIS E WHATSAPP
Conteúdo que educa (o que é proteção, o risco que as pessoas ignoram, casos reais) atrai. Resposta ágil converte. Quem demora horas para responder perde para quem responde em minutos.

4. PARCERIAS
Oficinas, lava-rápidos, lojas de autopeças, despachantes, grupos de motoristas de app. Locais onde o seu cliente já está. Uma boa parceria gera fluxo recorrente de indicações qualificadas.

REGRA DE OURO
Prospecção é DIÁRIA e em VOLUME. Não existe "semana de prospecção" seguida de semanas sem prospectar — isso cria o efeito sanfona (mês cheio, mês vazio). Um pouco todos os dias mantém o funil sempre alimentado.

ERRO COMUM
Esperar o cliente aparecer. O consultor passivo depende da sorte; o ativo constrói o próprio fluxo. Reserve um bloco fixo do dia só para gerar contatos novos.'
   where tenant_id = t and titulo = 'Aula 5.1 — Canais de prospecção';

  update public.itens set descricao =
'O ERRO QUE MATA A ABORDAGEM NO SINALEIRO
Tentar vender ali. No sinal você tem segundos e a pessoa está de passagem, muitas vezes apressada. O objetivo NÃO é fechar — é captar o contato para um atendimento consultivo depois, com calma.

OBJETIVO ÚNICO
Sair com o número de WhatsApp e o modelo do veículo. Só isso. Quem tenta explicar coberturas no sinal perde o tempo e o contato.

SCRIPT (15 A 30 SEGUNDOS)
"Bom dia! Tudo bem? Sou consultor da Todos Protegidos. Trabalho com proteção para o seu carro/moto, com assistência 24h e indenização pela FIPE. Posso te mandar uma cotação rápida no WhatsApp, sem compromisso? Qual o seu melhor número?"

POR QUE FUNCIONA
- É curto e respeita o tempo da pessoa.
- Já diz o benefício (assistência 24h, FIPE) em uma frase.
- Termina com uma pergunta fácil de responder (o número), não um pedido de compra.
- "Sem compromisso" reduz a barreira.

AS REGRAS DE OURO
- Sorria e seja educado. Energia positiva abre portas; abordagem mecânica fecha.
- Seja breve. No primeiro "não tenho interesse", agradeça e siga — não insista no sinal.
- NÃO discuta preço no sinaleiro. Preço se trata no atendimento, com valor já construído.
- Anote o contato E o modelo/ano do veículo na hora (você vai precisar para a cotação).

DEPOIS DO SINAL
O contato captado vira um lead no seu CRM, com data de retorno. A venda acontece no WhatsApp/atendimento seguinte — por isso a qualidade da próxima mensagem é decisiva (próxima aula).'
   where tenant_id = t and titulo = 'Aula 5.2 — Roteiro de abordagem no sinaleiro';

  update public.itens set descricao =
'OS PRIMEIROS MINUTOS VALEM OURO
Velocidade de resposta é uma das maiores vantagens competitivas que existem. Lead que recebe resposta em minutos converte muito mais do que o mesmo lead respondido horas depois — quando o interesse já esfriou ou um concorrente já respondeu.

SCRIPT DE PRIMEIRO CONTATO
"Oi, [nome]! Aqui é o [seu nome], da Todos Protegidos. Foi ótimo falar com você agora há pouco. Para eu montar a sua cotação certinha, o seu carro é o [modelo/ano]? Em 1 minutinho te passo o valor e o que está incluso."

POR QUE FUNCIONA
- Usa o NOME da pessoa (personalização imediata).
- Resgata o contexto ("falar com você agora há pouco") — gera familiaridade.
- Faz UMA pergunta objetiva (confirma o veículo) que conduz para a cotação.
- Promete valor rápido ("em 1 minutinho"), reduzindo a ansiedade.

PRINCÍPIOS DA CONVERSA POR WHATSAPP
1. Conduza, não empurre. Cada mensagem deve levar para o próximo passo (cotação → vistoria → fechamento), não virar um papo solto que não anda.
2. Uma pergunta por vez. Mensagens com cinco perguntas confundem e travam a resposta.
3. Áudios curtos e objetivos quando ajudam a criar conexão; texto quando o cliente prefere ler. Observe e se adapte.
4. Evite "paredes de texto". Quebre em mensagens curtas e legíveis no celular.
5. Profissionalismo: boa escrita, sem excesso de gírias, sem emojis demais. Você representa a empresa.

FOLLOW-UP NO WHATSAPP
Se o cliente sumiu, não desapareça também. Retorne com valor, não com cobrança: "Oi [nome], consegui uma condição boa pro seu [modelo]. Quer que eu te mostre?" é melhor que "e aí, vai fechar?". Agende o follow-up no CRM e cumpra.'
   where tenant_id = t and titulo = 'Aula 5.3 — Abordagem por WhatsApp';

  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 5 · Prospecção e Abordagem';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 5.4 — Leitura aprofundada: construindo uma máquina de prospecção') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 5.4 — Leitura aprofundada: construindo uma máquina de prospecção', 'Material de estudo',
'Prospecção amadora depende de sorte e humor. Prospecção profissional é um sistema previsível. Este material mostra como montar o seu.

1. A LÓGICA DA PREVISIBILIDADE
Se você conhece a sua taxa de conversão e a sua meta, a prospecção deixa de ser angústia e vira conta. Exemplo: para 8 vendas no mês, com a sua taxa, talvez precise de 200 novos contatos. Isso é ~10 por dia útil. Sabendo o número, você simplesmente executa — e para de depender de "como está o mês".

2. DIVERSIFIQUE AS FONTES
Depender de um único canal é frágil. Combine: indicações (a melhor conversão), pontos de fluxo (volume), redes sociais (alcance) e parcerias (recorrência). Se um canal seca, os outros sustentam.

3. A MÁQUINA DE INDICAÇÕES
A indicação é o canal mais barato e de maior conversão — e o mais negligenciado. Crie o hábito: todo cliente novo e satisfeito recebe o pedido de indicação. Facilite: "me manda o contato de duas pessoas que andam de carro/moto e que você acha que iam querer essa tranquilidade". Quem pede com naturalidade, recebe.

4. PARCERIAS QUE GERAM FLUXO
Identifique negócios que atendem o seu público (oficina, lava-rápido, autopeças, grupos de motoristas de app). Ofereça uma relação ganha-ganha: você cuida da proteção dos clientes deles, eles ganham com indicações. Uma parceria ativa pode valer dezenas de leads por mês.

5. CONTEÚDO QUE ATRAI
Nas redes, eduque em vez de só anunciar. Poste o risco que as pessoas ignoram (perda total é mais comum que roubo), casos reais de assistência, o passo a passo de um acionamento. Conteúdo gera autoridade; autoridade gera contato espontâneo.

6. CONSISTÊNCIA ACIMA DE TUDO
A diferença entre quem vive de prospecção e quem sofre com ela é uma só: um pouco TODO dia versus muito de vez em quando. Bloqueie no dia um horário fixo só para gerar contatos novos. Trate esse horário como inegociável — é a fundação de toda a sua receita.

RESUMO
Meta clara → número de contatos necessários → canais diversificados → execução diária → registro no CRM → pedido de indicação no pós-venda. Repetido com constância, isso vira uma máquina que não depende de sorte.', 4);
  end if;

  -- =========================================================
  -- 5) MÓDULO 6 — Diagnóstico com SPIN Selling
  -- =========================================================
  update public.itens set descricao =
'POR QUE PERGUNTAR VENDE MAIS QUE FALAR
A venda consultiva inverte a lógica do vendedor tradicional: em vez de despejar características do produto, você faz perguntas que levam o próprio cliente a perceber a necessidade. Quando é o cliente quem conclui que precisa, a resistência cai. O SPIN é o roteiro de perguntas que organiza isso.

SPIN = SITUAÇÃO, PROBLEMA, IMPLICAÇÃO, NECESSIDADE

1. SITUAÇÃO — entender o contexto
Perguntas que mapeiam a realidade do cliente sem pressioná-lo.
"Qual carro você tem e como usa no dia a dia?" / "Já faz tempo que dirige?" / "Usa mais para trabalho ou família?"
Cuidado: não exagere nas perguntas de situação, ou vira interrogatório. Colete o essencial e avance.

2. PROBLEMA — revelar a dor
Perguntas que trazem à tona insatisfações e riscos.
"Hoje você tem alguma proteção?" / "Já passou perrengue com guincho ou pane?" / "Te preocupa a ideia de ficar sem o carro se acontecer algo?"
Aqui o cliente começa a admitir que existe um risco real.

3. IMPLICAÇÃO — ampliar a consciência da dor
Esta é a etapa mais poderosa e a mais ignorada. Você conecta o problema às suas consequências.
"Se o carro fosse roubado amanhã, como ficaria o seu trabalho?" / "E o financiamento, continuaria correndo mesmo sem o carro?" / "Quanto isso desorganizaria o orçamento da família?"
A implicação transforma um risco abstrato em um cenário concreto e desconfortável — e é esse desconforto saudável que cria a urgência de resolver.

4. NECESSIDADE DE SOLUÇÃO — o cliente verbaliza o ganho
Perguntas que fazem o cliente dizer, com as próprias palavras, o valor da solução.
"Então, ter 100% da FIPE e assistência 24h resolveria essa preocupação, certo?" / "Faria diferença pra você saber que, acontecendo algo, está coberto?"
Quando o cliente responde "sim, faria diferença", ele praticamente se vendeu sozinho.

A REGRA CENTRAL
Ouça mais do que fala. Quem pergunta bem, conduz. O objetivo não é "ganhar a conversa", é fazer o cliente enxergar a própria necessidade.'
   where tenant_id = t and titulo = 'Aula 6.1 — As 4 perguntas SPIN';

  update public.itens set descricao =
'O SPIN APLICADO, PASSO A PASSO
Teoria sem roteiro não vira venda. Aqui está o SPIN traduzido para um atendimento real de proteção veicular, na ordem em que você deve conduzir.

ETAPA 1 — SITUAÇÃO
"Me conta: qual o veículo e pra que você mais usa ele — trabalho, família, os dois?"
Objetivo: entender uso, importância do veículo e perfil. Anote tudo.

ETAPA 2 — PROBLEMA
"Você já tem alguma proteção hoje? E o que mais te preocupa na ideia de ficar sem o carro?"
Objetivo: trazer a dor à tona. Deixe o cliente falar; não interrompa para apresentar o plano ainda.

ETAPA 3 — IMPLICAÇÃO
"Imagina um roubo ou uma batida com perda total, sem cobertura. Qual seria o impacto no seu bolso e na sua rotina? E se ainda tiver prestações pra pagar?"
Objetivo: ampliar a consciência da consequência. É aqui que nasce a urgência. Não tenha pressa nesta etapa.

ETAPA 4 — NECESSIDADE DE SOLUÇÃO
"Então me diz: ter a tranquilidade de receber 100% da FIPE e contar com guincho 24h resolveria essa preocupação?"
Objetivo: fazer o cliente verbalizar o valor. Quando ele concorda, você só precisa apresentar como entregar isso.

E SÓ ENTÃO: A APRESENTAÇÃO
Depois da etapa 4, o cliente JÁ QUER a solução. Agora sim você apresenta o plano — e conecta cada cobertura à dor que ELE revelou. Isso é o oposto de "empurrar": é entregar exatamente o que o cliente acabou de dizer que precisa.

ERROS QUE DESTROEM O SPIN
- Apresentar a solução antes de entender a dor (o erro nº 1 dos vendedores).
- Pular a implicação e ir direto ao preço.
- Falar mais que o cliente.
- Fazer perguntas como interrogatório frio, sem escuta de verdade.

DICA DE OURO
Personalize. As mesmas quatro perguntas mudam de tom para o entregador de app, o pai de família e a pessoa que acabou de comprar o primeiro carro. Adapte a linguagem; mantenha a estrutura.'
   where tenant_id = t and titulo = 'Aula 6.2 — Roteiro SPIN na proteção veicular';

  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 6 · Diagnóstico com SPIN Selling';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 6.3 — Leitura aprofundada: a arte de perguntar') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 6.3 — Leitura aprofundada: a arte de perguntar', 'Material de estudo',
'A venda consultiva nasceu de uma descoberta simples e poderosa: em vendas de maior valor, quem PERGUNTA bem vende mais que quem ARGUMENTA bem. Este material aprofunda o porquê e o como.

1. POR QUE A PERGUNTA É MAIS FORTE QUE O ARGUMENTO
Quando você AFIRMA ("você precisa de proteção"), o cliente pode discordar — é a sua opinião contra a dele. Quando você PERGUNTA e ele CONCLUI ("é, se acontecer algo eu ficaria mal"), a conclusão é dele, e ninguém discute com a própria conclusão. Perguntar transfere a descoberta para o cliente.

2. A ESCADA EMOCIONAL DO SPIN
Situação é neutra. Problema desperta atenção. Implicação gera desconforto produtivo (a percepção de que o risco é real e caro). Necessidade transforma esse desconforto em desejo de solução. Você está conduzindo o cliente por uma escada emocional: do "está tudo bem" ao "preciso resolver isso".

3. O PODER DA IMPLICAÇÃO
A maioria dos vendedores para no problema ("você não tem proteção") e pula direto para a oferta. Os melhores exploram a implicação: tornam visível o tamanho do prejuízo evitado. "Sem o carro, como você trabalharia?" vale mais que dez características do plano. Implicação bem feita é o que cria urgência sem pressão.

4. ESCUTA ATIVA
Perguntar sem ouvir é pior que não perguntar. Demonstre escuta: repita o que o cliente disse ("então o carro é essencial pro seu trabalho..."), valide o sentimento, e use as palavras DELE na sua apresentação. O cliente compra de quem ele sente que o entendeu.

5. SILÊNCIO É FERRAMENTA
Depois de uma boa pergunta de implicação, cale-se. O silêncio deixa o cliente pensar e responder com profundidade. Vendedor ansioso preenche o silêncio e atropela a reflexão que estava prestes a converter.

6. SPIN NÃO É MANIPULAÇÃO
A diferença entre venda consultiva e manipulação é a INTENÇÃO. Você não está inventando um problema falso; está ajudando o cliente a enxergar um risco real que ele subestimava. Se a proteção realmente faz sentido pra ele, conduzi-lo a perceber isso é um serviço — não um truque.

RESUMO PRÁTICO
Pergunte mais, afirme menos. Mapeie a situação, exponha o problema, amplie a implicação e deixe o cliente verbalizar a necessidade. Use as palavras dele, escute de verdade, respeite o silêncio. Aí, e só aí, apresente a solução.', 3);
  end if;

  -- =========================================================
  -- 6) MÓDULO 7 — Apresentação de Valor (Challenger)
  -- =========================================================
  update public.itens set descricao =
'O VENDEDOR QUE ENSINA
A abordagem Challenger nasceu de uma constatação: os melhores vendedores não são os mais simpáticos nem os que mais baixam preço — são os que ENSINAM algo novo ao cliente, PERSONALIZAM para a realidade dele e ASSUMEM O CONTROLE da conversa com firmeza.

OS TRÊS PILARES
1. Ensinar: trazer um insight que o cliente ainda não tinha.
2. Personalizar: adaptar esse insight ao mundo específico do cliente.
3. Assumir o controle: conduzir a conversa com segurança, inclusive no tema preço.

ENSINAR O RISCO QUE O CLIENTE NÃO VÊ
A maioria das pessoas tem uma percepção distorcida de risco. Você agrega valor ao corrigir essa percepção com fatos:
- "A maioria acha que roubo é o maior risco, mas batida com perda total é mais frequente e costuma ser mais cara."
- "Sem proteção, o prejuízo não é só o carro: é ficar sem trabalhar E ainda pagar o financiamento de um bem que não existe mais."
- "Enchente e granizo viraram comuns — e quase ninguém pensa nisso até acontecer."
Esse tipo de informação reposiciona a conversa: você deixa de ser "mais um vendedor" e vira um consultor que abriu os olhos do cliente.

PERSONALIZAR
O insight genérico tem força; o personalizado tem o dobro. Conecte o risco ao mundo do cliente: a região onde ele anda, o tipo de uso (app, família), o fato de o carro ser financiado, a profissão. "Pra você, que depende da moto pra trabalhar, ficar parado é perder renda" é muito mais forte que um dado solto.

ASSUMIR O CONTROLE
Assumir o controle NÃO é ser grosseiro. É conduzir com segurança: não gaguejar no preço, não pedir desculpas por cobrar, recomendar com convicção o plano certo e direcionar para o próximo passo. O cliente confia em quem demonstra domínio e firmeza tranquila.

EM RESUMO
Ensine algo que reposiciona o risco, personalize para a vida do cliente e conduza a conversa com firmeza. Esse é o consultor que vende valor — não o que implora desconto.'
   where tenant_id = t and titulo = 'Aula 7.1 — Ensine o risco que o cliente não vê';

  update public.itens set descricao =
'PREÇO É O QUE SE PAGA; VALOR É O QUE SE RECEBE
Quando a conversa gira só em torno de preço, você entra numa guerra que não tem fim — sempre haverá alguém oferecendo R$ 5 a menos. A saída é reposicionar a conversa para VALOR. Ancoragem é a técnica central para isso.

ANCORAGEM NO RISCO EVITADO
Antes de falar da mensalidade, ancore na dimensão do que está sendo protegido:
"Quanto custaria repor o seu carro hoje, do zero? A FIPE dele é cerca de R$ X. A proteção custa o equivalente a centavos por dia disso."
Agora a mensalidade não é comparada com "zero" (não pagar nada), e sim com o tamanho do prejuízo que ela evita. O cérebro do cliente passa a ver a mensalidade como pequena diante do risco.

COMPARE CUSTO-BENEFÍCIO, NÃO SÓ PREÇO
Se o cliente compara só o número da mensalidade, ele ignora o que está incluso. Traga a comparação completa: assistência 24h, sem consulta a score, menos burocracia, indenização pela FIPE, atendimento humano e próximo. O "mais barato" muitas vezes entrega menos — e o seu papel é tornar isso visível.

TORNE O VALOR TANGÍVEL
Compare a mensalidade com um gasto cotidiano: "É menos do que você gasta por mês com [um delivery / um streaming / alguns cafés]." Isso encolhe o preço na percepção e mostra que proteção cabe no orçamento.

USE PROVA
Casos reais convencem mais que adjetivos. "Semana passada um associado teve o carro roubado e recebeu a indenização" vale mais que "somos confiáveis". Prova social reduz o medo de decidir.

O QUE EVITAR
- Brigar por preço logo de cara. Primeiro construa valor; preço se discute depois.
- Dar desconto antes de o cliente pedir (você desvaloriza o próprio produto).
- Pedir desculpas pelo valor. Quem acredita no que vende não se encolhe ao falar de preço.

REGRA DE OURO
Se o cliente só fala de preço, é sinal de que ele ainda não enxergou valor suficiente. Volte e construa valor — não corte preço.'
   where tenant_id = t and titulo = 'Aula 7.2 — Ancoragem de valor e comparação';

  update public.itens set descricao =
'A APRESENTAÇÃO QUE CONECTA TUDO
A apresentação não é o momento de "falar do produto". É o momento de DEVOLVER ao cliente, em forma de solução, exatamente a dor que ele revelou no diagnóstico. Quanto mais a sua apresentação espelhar as palavras dele, mais ela converte.

A ESTRUTURA
1. Recapitule a dor (com as palavras do cliente).
2. Apresente a solução conectada a essa dor.
3. Ancore o valor (FIPE / risco evitado).
4. Reforce a assistência (benefício de uso frequente).
5. Apresente a mensalidade já comparada a um gasto cotidiano.
6. Conduza para o próximo passo.

SCRIPT MODELO
"Pelo que você me contou, o que mais pesa é [dor do cliente — ex.: ficar sem o carro que usa pra trabalhar]. O nosso plano resolve exatamente isso: [cobertura ligada à dor]. Em caso de perda total ou roubo, você recebe 100% da FIPE — hoje cerca de R$ [valor]. E tem guincho e assistência 24h, pra você nunca ficar na mão no dia a dia. Tudo isso por R$ [mensalidade], menos do que [comparação cotidiana]. Faz sentido pra você?"

POR QUE FUNCIONA
- Começa pela dor DELE, não pelo produto.
- Cada item entregue tem um "porquê" ligado à vida do cliente.
- O valor é ancorado antes do preço aparecer.
- Termina com uma pergunta de validação que abre o fechamento.

PERSONALIZE OS COLCHETES
Nunca recite o script de forma robótica. Os colchetes existem para serem preenchidos com a realidade de CADA cliente. O mesmo roteiro soa totalmente diferente — e muito mais forte — quando carrega o nome, o veículo e a dor específica da pessoa à sua frente.

DEPOIS DA APRESENTAÇÃO
Se você fez bem o diagnóstico e a apresentação, o fechamento é uma consequência natural — e é exatamente isso que o próximo módulo desenvolve.'
   where tenant_id = t and titulo = 'Aula 7.3 — Roteiro de apresentação';

  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 7 · Apresentação de Valor (Challenger)';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 7.4 — Leitura aprofundada: vender valor, não preço') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 7.4 — Leitura aprofundada: vender valor, não preço', 'Material de estudo',
'O consultor que só sabe competir por preço está sempre à beira de perder a venda para alguém mais barato. Este material aprofunda como construir e comunicar VALOR — a única defesa real contra a guerra de preço.

1. A EQUAÇÃO DE VALOR NA CABEÇA DO CLIENTE
O cliente compara, mesmo sem perceber, o BENEFÍCIO percebido contra o CUSTO percebido. Se o benefício parece pequeno, qualquer preço parece caro. Se o benefício é grande e claro, o preço se justifica. O seu trabalho não é baixar o custo — é elevar o benefício percebido.

2. O ERRO DE COMEÇAR PELO PREÇO
Quando o vendedor abre falando de mensalidade, o cliente não tem com o que comparar, e o número soa alto. A ordem correta é: dor → valor → prova → e só então preço (já ancorado). Preço apresentado cedo demais vira objeção; apresentado no momento certo vira detalhe.

3. ANCORAGEM, EM PROFUNDIDADE
Ancoragem é o princípio psicológico de que a primeira referência molda a percepção das seguintes. Se a primeira referência for "o carro vale R$ 40 mil e repor isso seria um desastre", a mensalidade de algumas dezenas de reais parece minúscula. Se não houver âncora, a mensalidade é comparada com zero — e perde. Sempre ancore no valor do bem e no risco evitado ANTES do preço.

4. O INSIGHT QUE REPOSICIONA
Vendedores medianos confirmam o que o cliente já pensa. Os melhores ENSINAM algo que muda a percepção dele. No nosso ramo, o insight clássico é: "perda total por colisão é mais comum e mais cara do que roubo, e quase ninguém se prepara para isso". Um bom insight faz o cliente repensar a própria segurança — e te posiciona como autoridade.

5. PROVA SOCIAL E HISTÓRIAS
Números convencem a razão; histórias convencem a emoção, e a decisão é emocional. Tenha sempre na ponta da língua 2 ou 3 casos reais (respeitando a privacidade): o associado que foi indenizado, o que usou o guincho na estrada, o que se arrependeu de ter cancelado. Histórias derrubam a objeção do "será que vale?".

6. FIRMEZA NO PREÇO
Acredite no que você vende. Se você hesita ou pede desculpas ao dizer o valor, transmite que nem você acha que vale. Diga o preço com naturalidade e firmeza, logo após ter construído o valor. Convicção do consultor vira confiança do cliente.

7. QUANDO O CLIENTE INSISTE NO PREÇO
Insistência em preço é quase sempre sintoma de valor insuficiente percebido — raramente é só dinheiro. Em vez de cortar o preço, volte e reforce o valor: o risco, a FIPE, a assistência, a tranquilidade. Cortar preço resolve a venda de hoje e destrói a margem e a percepção de amanhã.

RESUMO
Eleve o benefício percebido, ancore antes de precificar, ensine um insight, use provas e fale o preço com firmeza. Valor bem construído torna o preço um detalhe — e tira você da guerra que ninguém ganha.', 4);
  end if;

  -- =========================================================
  -- 7) MÓDULO 8 — Fechamento e Tratamento de Objeções
  -- =========================================================
  update public.itens set descricao =
'QUEM NÃO PEDE, NÃO FECHA
O erro mais comum no fim do atendimento é não pedir a venda. O consultor faz tudo certo e, na hora decisiva, fica esperando o cliente dizer "quero fechar". Fechar é conduzir o cliente à decisão com naturalidade — e isso é responsabilidade sua.

A PERGUNTA DE CONTINUIDADE
Em vez do constrangedor "e aí, você quer fechar?", use uma pergunta que assume o avanço:
"Para já deixar a sua proteção ativa hoje, vou precisar confirmar alguns dados, tudo bem?"
Ela presume a decisão de forma leve e move para a ação. Se o cliente seguir, está fechando; se levantar uma objeção, ótimo — você a trata.

OUTRAS TÉCNICAS DE FECHAMENTO
- Fechamento por alternativa: "Você prefere começar no plano Essencial ou no Total?" Qualquer resposta avança a venda. Em vez de "sim ou não", você oferece "A ou B".
- Resumo de valor + próximo passo: recapitule rapidamente o que o cliente ganha e direcione: "Então fica assim: 100% da FIPE, guincho 24h, por R$ X. O próximo passo é a vistoria — consigo agendar pra hoje ou amanhã?"
- Fechamento por escassez REAL: se houver uma condição com prazo verdadeiro (ex.: isenção de adesão neste mês), use-a — mas nunca invente urgência falsa, que destrói a confiança.

A POSTURA NO FECHAMENTO
- Peça a venda com naturalidade e confiança. Hesitação contagia o cliente.
- Faça a pergunta de fechamento e CALE-SE. Deixe o cliente responder. Quem fala primeiro depois do fechamento costuma "comprar de volta" a própria venda.
- Trate o fechamento como o passo natural de quem ajudou o cliente — não como o momento de "arrancar" um sim.

LEMBRE-SE
Se o diagnóstico (SPIN) e a apresentação de valor (Challenger) foram bem feitos, o fechamento é quase automático. Fechamento difícil quase sempre é sintoma de etapa anterior mal feita.'
   where tenant_id = t and titulo = 'Aula 8.1 — Técnicas de fechamento';

  update public.itens set descricao =
'OBJEÇÃO NÃO É "NÃO" — É DÚVIDA
A maior virada de chave em vendas é entender que objeção raramente significa rejeição. Quase sempre significa: "ainda tenho uma dúvida ou um receio que você não resolveu". Objeção é um pedido de ajuda disfarçado — e um sinal de interesse, porque quem não tem interesse nenhum simplesmente encerra.

A ESTRUTURA UNIVERSAL: ACOLHER → ESCLARECER → RECONDUZIR
1. Acolher: valide o sentimento sem brigar. "Entendo", "faz sentido você pensar nisso". Isso baixa a guarda do cliente.
2. Esclarecer: traga a informação ou a perspectiva que dissolve a dúvida.
3. Reconduzir: volte ao fechamento ou ao próximo passo.

OS CLÁSSICOS — COM SCRIPT

"ESTÁ CARO"
Acolher: "Entendo. Caro comparado a quê?"
Esclarecer: "Veja: por R$ [x] por dia você protege um bem de R$ [FIPE] e ainda tem guincho 24h. O caro de verdade é ter um prejuízo total e ficar sem o carro e sem indenização."
Reconduzir: "Faz sentido garantir essa tranquilidade hoje?"

"VOU PENSAR"
Acolher: "Claro, é uma decisão importante."
Esclarecer (descobrir a objeção real): "Só pra eu te ajudar melhor: o que ainda falta ficar claro — é a cobertura, o valor ou a forma de ativar?"
Reconduzir: trate a dúvida específica que aparecer e volte ao fechamento.
(Importante: "vou pensar" quase sempre esconde outra objeção. Sua missão é descobri-la, não aceitar o adiamento e sumir.)

"JÁ TENHO SEGURO"
Acolher: "Que bom que você se preocupa em se proteger."
Esclarecer: "Posso te mostrar onde a proteção veicular costuma sair mais em conta e com menos burocracia? Sem compromisso — você compara e decide."
Reconduzir: faça a comparação de valor e ofereça a cotação.

"PRECISO FALAR COM MEU/MINHA CÔNJUGE"
Acolher: "Perfeito, decisão de casa se decide junto."
Esclarecer: "Quer que eu te passe um resumo rápido do que está incluso pra facilitar essa conversa? Assim vocês decidem com tudo na mão."
Reconduzir: agende um retorno com data definida.

REGRAS
- Nunca discuta nem trate o cliente como adversário. Você está do lado dele.
- Não baixe o preço no primeiro "está caro" — reposicione para valor.
- Toda objeção tratada termina com uma recondução ao próximo passo. Tratar e não reconduzir é deixar a venda morrer no ar.'
   where tenant_id = t and titulo = 'Aula 8.2 — Tratando objeções (scripts)';

  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 8 · Fechamento e Tratamento de Objeções';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 8.3 — Leitura aprofundada: psicologia da decisão') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 8.3 — Leitura aprofundada: psicologia da decisão', 'Material de estudo',
'Entender por que as pessoas decidem (e por que adiam) torna o fechamento muito mais natural. Este material reúne os princípios psicológicos que sustentam um bom fechamento — sem manipulação, com ética.

1. AS PESSOAS DECIDEM PELA EMOÇÃO E JUSTIFICAM PELA RAZÃO
A decisão de proteger o carro nasce de um sentimento (medo do prejuízo, desejo de tranquilidade) e depois é justificada com argumentos (FIPE, assistência, preço). Por isso o diagnóstico que toca a dor (SPIN) e a história real (prova) são tão poderosos: eles ativam a emoção que move a decisão. Só dados não fecham.

2. AVERSÃO À PERDA
As pessoas sentem a dor de perder cerca de duas vezes mais forte do que o prazer de ganhar o equivalente. Use isso de forma ética: foque no que o cliente EVITA perder (o carro, a renda, a tranquilidade) mais do que no que ele "ganha". "Não ficar no prejuízo" mobiliza mais que "ter uma cobertura".

3. O CUSTO DA INDECISÃO
Adiar parece seguro para o cliente, mas tem um custo invisível: ele segue exposto ao risco. Torne esse custo visível com elegância: "enquanto a gente adia, o carro continua sem proteção — e é justo nesse intervalo que ninguém quer que aconteça algo". Não é pressão; é realidade.

4. POR QUE "VOU PENSAR" ACONTECE
Quase sempre é um de três motivos: (a) falta de valor percebido, (b) uma objeção não dita (preço, confiança, terceiro decisor), ou (c) ausência de urgência. O fechamento profissional não aceita o "vou pensar" passivamente — investiga com gentileza qual dos três é, e trata a causa.

5. COMPROMISSO E COERÊNCIA
Quando o cliente concorda com pequenos "sins" ao longo do atendimento (sim, o carro é importante; sim, a FIPE faz diferença; sim, a assistência ajuda), ele constrói uma trajetória de concordância que torna o "sim" final coerente com tudo o que ele já disse. Por isso as perguntas de validação ao longo da conversa preparam o fechamento.

6. PROVA SOCIAL E AUTORIDADE
Saber que outras pessoas como ele já fizeram a mesma escolha reduz o medo de errar. E perceber que VOCÊ domina o assunto gera confiança para decidir. Demonstre domínio tranquilo e cite (com discrição) casos reais.

7. O FECHAMENTO ÉTICO
Nada disso serve para empurrar algo que o cliente não precisa. Se a proteção faz sentido para ele, conduzi-lo à decisão é um SERVIÇO — você o está ajudando a sair da inércia que o mantém exposto. Se honestamente não faz sentido, o profissional diz isso. Reputação vale mais que uma venda.

RESUMO
Emoção decide e razão justifica; a dor de perder é forte; a indecisão tem custo; "vou pensar" tem causa; pequenos sins preparam o grande sim; prova e autoridade dão segurança. Use tudo isso com ética, a favor do cliente.', 3);
  end if;

  -- =========================================================
  -- 8) MÓDULO 9 — Vistoria, Pós-venda e Retenção
  -- =========================================================
  update public.itens set descricao =
'A VENDA SÓ ESTÁ COMPLETA QUANDO A PROTEÇÃO ESTÁ ATIVA
Muitas vendas se perdem DEPOIS do "sim", por uma vistoria malfeita que atrasa ou recusa a ativação. A vistoria é a ponte entre o fechamento e o cliente efetivamente protegido — trate-a com o mesmo cuidado da venda.

O CHECKLIST DE FOTOS
- Frente, traseira e as duas laterais do veículo.
- Painel com o hodômetro visível (a quilometragem).
- Número do chassi.
- Pneus e estado geral.
- Documento do veículo conforme exigido (em muitos apps, somente foto/JPG — PDF costuma NÃO ser aceito).
Fotos nítidas, com boa luz e placa legível, evitam recusa e retrabalho. Foto borrada = vistoria recusada = ativação atrasada = cliente inseguro.

ANTES DE ENVIAR
- Confira os dados do associado e do veículo (nome, placa, modelo, ano). Um erro de digitação pode travar tudo.
- Anote avarias preexistentes — isso protege o associado e a associação em um eventual evento futuro.
- Revise as fotos uma a uma. É mais rápido refazer agora que depois.

EXPLIQUE A CARÊNCIA
No momento da ativação, reforce ao cliente o que é a carência e quando cada cobertura passa a valer. Esse alinhamento de expectativa evita a pior frustração possível: o associado acionar logo nos primeiros dias e descobrir que ainda não estava coberto. Transparência aqui é o que sustenta a confiança que você construiu na venda.

A REGRA
Vistoria bem feita = ativação rápida = cliente seguro e satisfeito = menos cancelamento e mais indicação. Vistoria relapsa = retrabalho, atraso e um associado começando a relação já desconfiado.'
   where tenant_id = t and titulo = 'Aula 9.1 — Protocolo de vistoria';

  update public.itens set descricao =
'A VENDA É O COMEÇO DO RELACIONAMENTO, NÃO O FIM
Vender uma vez é bom; construir uma carteira que renda mensalidade, recompra e indicações é o que faz uma carreira sólida. O pós-venda é a etapa mais negligenciada — e a mais lucrativa.

POR QUE O PÓS-VENDA IMPORTA TANTO
- Cliente bem cuidado cancela menos (retenção = receita recorrente preservada).
- Cliente satisfeito indica (o canal de maior conversão que existe).
- Cliente atendido com excelência recompra e amplia (segundo veículo, família).
Manter um associado custa muito menos do que conquistar um novo. A carteira é o seu patrimônio.

SCRIPT DE BOAS-VINDAS (logo após a ativação)
"[nome], a sua proteção está ativa! Salva o meu contato aqui — qualquer necessidade de guincho, assistência ou dúvida, fala comigo direto que eu te oriento. E se você conhecer alguém que também ia querer essa tranquilidade, a sua indicação vale muito pra mim."
Esse contato faz três coisas: confirma a ativação, posiciona você como suporte (não some após vender) e já planta a semente da indicação.

PEDIDO DE INDICAÇÃO
O melhor momento é agora, com o cliente satisfeito. Peça de forma específica e fácil: "me indica duas pessoas que andam de carro ou moto e que você acha que iam gostar de ficar protegidas?". Pedido vago ("se souber de alguém...") rende pouco; pedido específico rende contatos.

REATIVAÇÃO DE EX-ASSOCIADO
Quem já foi associado conhece o valor — é um lead quente. Use uma condição especial real quando houver (ex.: isenção da 2ª mensalidade):
"[nome], preparei uma condição especial pra você voltar a ficar protegido: isenção da 2ª mensalidade. Posso reativar hoje?"

RETENÇÃO ATIVA
- Contato periódico (não só quando vai vender algo).
- Lembrete de como acionar a assistência.
- Estar presente em um momento de necessidade do cliente — é aí que a fidelidade se forma de verdade.
Um associado que sentiu que você o ajudou num aperto dificilmente troca por R$ 5 a menos em outro lugar.'
   where tenant_id = t and titulo = 'Aula 9.2 — Pós-venda, indicação e reativação';

  select id into m from public.modulos where tenant_id = t and titulo = 'Módulo 9 · Vistoria, Pós-venda e Retenção';
  if m is not null and not exists (select 1 from public.itens where tenant_id = t and modulo_id = m and titulo = 'Aula 9.3 — Leitura aprofundada: carteira que rende') then
    insert into public.itens (tenant_id, modulo_id, tipo, titulo, meta, descricao, ordem) values
    (t, m, 'info', 'Aula 9.3 — Leitura aprofundada: carteira que rende', 'Material de estudo',
'O consultor iniciante pensa em vendas; o consultor profissional pensa em CARTEIRA. Este material mostra por que cuidar de quem já é cliente é a decisão mais inteligente da sua carreira.

1. O VALOR DE UMA CARTEIRA
Cada associado ativo é uma relação que pode gerar: permanência (mensalidade recorrente), indicações, recompra (segundo veículo, família) e reputação. Uma carteira bem cuidada trabalha por você todos os dias, mesmo quando você não está prospectando. É o ativo que separa o vendedor que recomeça do zero todo mês do consultor que constrói algo que cresce.

2. CONQUISTAR x RETER
Conquistar um cliente novo exige prospecção, diagnóstico, apresentação, fechamento — muito esforço. Reter um cliente que já confia em você exige atenção e presença — muito menos esforço, muito mais retorno. Negligenciar a base para correr só atrás de novos é furar o próprio balde: você enche de um lado e perde do outro.

3. AS CAUSAS DE CANCELAMENTO (e como evitar)
- Expectativa mal alinhada (carência não explicada): resolva sendo transparente na venda e na ativação.
- Sensação de abandono (consultor sumiu): resolva com contato periódico.
- Aperto financeiro: resolva mostrando valor e oferecendo alternativas antes de perder o associado.
- Mau atendimento num momento de necessidade: resolva orientando bem o acionamento (0800 e Setor de Eventos, conforme o caso) e acompanhando.

4. A ECONOMIA DA INDICAÇÃO
Um cliente satisfeito que indica reduz drasticamente o seu custo e o seu esforço de aquisição. Se cada associado feliz gerar uma indicação, a sua carteira cresce sozinha, em progressão. Por isso o pedido de indicação não é um detalhe — é uma estratégia central de crescimento.

5. RITMO DE RELACIONAMENTO
Crie um ritmo simples: contato de boas-vindas na ativação; um check-in algumas semanas depois; presença em datas e necessidades; pedido de indicação nos momentos de satisfação. Não precisa ser complexo — precisa ser CONSTANTE.

6. PRESENÇA NO MOMENTO CERTO
A fidelidade nasce nos momentos de necessidade. O associado que precisou de um guincho à noite e foi bem orientado por você lembra disso para sempre. Esteja disponível e oriente com clareza nesses momentos — é o melhor investimento de retenção que existe.

RESUMO
Trate cada venda como o início de uma relação. Alinhe expectativas, mantenha presença, esteja no momento de necessidade e peça indicações com naturalidade. A carteira bem cuidada é o que transforma um bom mês em uma carreira sólida.', 3);
  end if;

  raise notice 'Conteudo aprofundado aplicado e modulos institucionais reordenados (tenant matriz).';
end $$;
