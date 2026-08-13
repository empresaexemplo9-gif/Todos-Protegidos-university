# Especificação de Paridade - Sona x AVA

Referência para levar a plataforma interna Sona a cobrir tudo o que a empresa faz hoje no AVA (ava.dev.br). Inventário levantado em 13/08/2026 diretamente na instância da Sona Automação no AVA.

## 1. Escopo e premissas

A Sona é software de uso exclusivamente interno da empresa. Não será vendida, revendida nem usada por terceiros. Isso elimina boa parte da complexidade do AVA:

- Sem multi-tenant: uma instalação, um banco. "Empresa" existe apenas para representar os CNPJs da própria Sona (matriz e filiais), não clientes de um SaaS.
- Sem módulo de cobrança ou assinatura: a tela "Pagamento Sistema" do AVA fica fora do escopo.
- Sem white-label: o módulo "Layout" do AVA vira tema fixo da Sona.
- Sem fluxo de revenda: campos como "Aprovação Revenda" saem do modelo.
- Perfis de acesso continuam necessários (comercial, técnico, compras, financeiro, administração), por função interna.
- Volume baixo (dezenas de usuários), o que permite arquitetura simples.
- Autenticação segue a atual (login próprio e sessão assinada), acrescentando perfis e permissão por tela e por ação.

## 2. Estado atual da Sona

Stack: React + Vite no front, servidor Node sem dependências externas (server/index.mjs), persistência em arquivo JSON (data/sona-data.json), sessão assinada (server/auth.mjs), catálogo inicial em server/catalog-seed.mjs, PWA instalável, execução local em localhost:4317 via Iniciar.cmd.

Já implementado: login (src/LoginScreen.tsx), gestor de acessos (src/AccessManager.tsx), workspace de propostas com escopo técnico (app/admin-workspace.tsx: planta com marcadores, paredes, zoom e pan, calibração de escala, simulador de cobertura Wi-Fi Ubiquiti), workspace de orçamento com catálogo SmartLife, VETRA e SCENARIO (app/budget-workspace.tsx), importação de catálogo por arquivo (app/catalog-import.tsx), proposta pública com aceite do cliente (app/proposta/page.tsx) e conector AVA (src/AvaIntegration.tsx), que hoje só importa catálogo de produtos com paginação e mapeamento de campos.

Leitura: a Sona já cobre bem a ponta comercial (proposta e orçamento) e tem um diferencial que o AVA não tem, o escopo técnico com planta e simulação de cobertura. O que falta é todo o ciclo depois da venda: projeto, obra, compra, estoque, financeiro, fiscal e ponto.

## 3. Padrão de tela do AVA

Quase todas as cerca de 140 telas do AVA seguem o mesmo desenho, e é isso que deve virar um componente genérico na Sona:

- Aba Listagem: filtro de período (data início e data fim), filtros de situação em checkbox, busca por IDs separados por vírgula, busca livre, seletor de relatório salvo, grid com colunas configuráveis (Criar/Configurar Colunas e Ver colunas vazias), ações por linha, exportação e contador de registros carregados.
- Aba Cadastro: formulário do registro.
- Abas auxiliares conforme o contexto da tela.

Exemplo real, a tela Orçamentos - Projetos: abas Listagem, Cadastro, Visitas, Dimensões, Estoque, Produtos, Resultado e Cronograma; filtros Orçamentos, Vendas, Entregue, Orç. OS, Descartados, Reprovados, Notas, Venda OS, Estoque OK e Estoque Insuficiente; colunas Nº Projeto, Tipo, Empresa, Análise de Estoque, Notas Emitidas, Tipo de Operação e Natureza, Fase Visita, Minha Aprovação, Cliente, Vendedor, Solicitantes, Título Capa, Status, Valor Produtos, Valor Serviços, Valor Total e Custo.

Decisão de arquitetura: construir primeiro um componente DataScreen genérico, dirigido por metadados (entidade, campos, filtros, colunas, ações), resolve a maior parte das telas de cadastro e listagem com pouco código por tela.

## 4. Inventário do AVA por módulo

### 4.1 Quadro 360º

Painel central: quadros salvos e atualizáveis (quadro padrão), filtros por cliente, empresa e venda, cartões criáveis, colunas configuráveis, visão em gráfico e agenda. Abas: CRM, Obra, Venda, Contrato, Comprar, Compras, Processo, Visita, Fiscal e Financeiro.

### 4.2 CRM - Prospecções

Tela Prospecção, com cadastros e relatórios próprios.

### 4.3 Vendas

Telas: Orçamentos - Projetos, Contrato Mensal.

Cadastros: Tipo Projeto, Reajustes de contratos, Cliente-Fornecedor-Outros, Produtos, Serviços, Tipo Serviço, Origem do contato, Tipo de Profissional, Assinatura Cliente, Cláusula, Contrato, Ambiente, Sistema, Local Produto, Conjunto de Produtos, Regra Preço de Venda, Texto Padrão, Categoria, Série, Fabricante, Marca, Unidade, Meta mensal, Probabilidade, Grade de Cores, Setor, Tabelas de Preço.

Relatórios: Aniversariantes, Análise de orçamentos, Consolidado de Produto, Curva ABC Cliente, Curva ABC Forma de Pagamento, Curva ABC Venda Produto, Histórico de Status do Pedido, Faturamento por Pedido, Faturamento por Produto, Comissões, Faturamento - Meta, Faturamento Consolidado, Contratos por Período, Faturamento com Impostos, Resultado Financeiro.

### 4.4 Obras

Telas: Obras, Processos. Cadastros: Conjunto de tarefas (processos), Fase de processo.

### 4.5 Compras

Telas: DashBoard, Produtos a comprar, Compras - Pedido - NF, Manifestações de NF-e.

Relatórios: Listagem de Compras, Curva ABC Fornecedor, Curva ABC Produto Compra.

### 4.6 Estoque

Telas: Posição de entrega, Separação, Controle de Estoque.

Relatórios: Curva ABC Estoque, Estoque Movimentado, Histórico de Movimentação.

### 4.7 Projeto

Telas: Agenda de Visitas, Cadastro de Visitas.

Cadastros: Fase da Obra, Motivo de Entrega Parcial, Notificação Visita, Pendência, Recursos, Conjunto de Recursos, Conjunto de Serviços, Conjunto de Tarefas, Solicitante, Status Cliente, Status da Obra, Tarefas.

Relatórios: Listagem Visitas, Funil de projetos, Pesquisa de Satisfação da visita, Validações de rotas.

### 4.8 Financeiro

Telas: Gerenciador Financeiro, Conciliação Bancária, Créditos Cliente, Cartão de crédito.

Cadastros: Open Finance, Carteira, Centros de Custo, Condição de pagamento, Feriados, Forma de Pagamento, Plano de Contas, Tipo Plano de Contas, Cartão, Conta Fixa.

Relatórios: Fluxo de Caixa, Fluxo de Caixa 30 dias, Fluxo de Caixa 12 meses, DRE 12 meses.

### 4.9 Fiscal

Tela: Emitir NFe e NFSe.

Cadastros: CFOP, Código da Forma de Emissão, CST COFINS, CST ICMS, CST IPI, CST PIS, De Olho no Imposto, Desoneração de ICMS, Estado, Finalidade NFe, Grupo de Numeração da NFe, Identificador de Local de Destino da Operação, Indicador Consumidor Final, Indicador da Forma de Pagamento, Mensagem da NF, Modalidade BC ICMS, Modalidade BC ICMS ST, Natureza da Movimentação, Natureza da Operação, NCM, País.

Relatórios: Produtos por nota, Baixar PDFs e XMLs por mês.

### 4.10 Administração

Telas: Configurar Notificações, Layout, Categorias de Produtos Gerais, Tarefas, Fila de E-mails, Fila de Importações.

Cadastros: Empresa, Perfil, Usuários, Cadastro Situação Tarefa.

### 4.11 Ponto Eletrônico

Telas: Ponto Eletrônico, Tratar Ponto, Fechar Ponto, Jornadas Ponto, Auditoria e Exportações.

### 4.12 Fora do escopo

Proposta AVA, porque a Sona já tem proposta própria e mais completa, e Pagamento Sistema, que é a cobrança do fornecedor do AVA.

## 5. Modelo de dados mínimo

Núcleo: Empresa, Usuario, Perfil, Permissao, Pessoa (cliente, fornecedor, outros), Contato, Endereco, Produto, Servico, Categoria, Marca, Fabricante, Unidade, Serie, ConjuntoProduto, TabelaPreco, RegraPrecoVenda, GradeCor, LocalProduto, Ambiente, Sistema, TextoPadrao, Setor, OrigemContato, TipoProfissional.

Comercial: Prospeccao, Probabilidade, Projeto (orçamento e venda), ProjetoItem, ProjetoServico, Dimensao, Cronograma, Contrato, ContratoMensal, Clausula, AssinaturaCliente, Reajuste, MetaMensal, Comissao, TipoProjeto, TipoServico.

Operação: Visita, AgendaVisita, Rota, PesquisaSatisfacao, NotificacaoVisita, Obra, FaseObra, StatusObra, StatusCliente, Processo, FaseProcesso, Tarefa, SituacaoTarefa, ConjuntoTarefas, Recurso, ConjuntoRecursos, ConjuntoServicos, Pendencia, Solicitante, MotivoEntregaParcial.

Suprimentos: NecessidadeCompra, PedidoCompra, PedidoCompraItem, NotaEntrada, ManifestacaoNFe, Estoque, MovimentoEstoque, Separacao, PosicaoEntrega.

Financeiro: Lancamento (a pagar e a receber), Parcela, Carteira, ContaBancaria, ExtratoBancario, Conciliacao, CentroCusto, PlanoContas, TipoPlanoContas, FormaPagamento, CondicaoPagamento, Cartao, ContaFixa, CreditoCliente, Feriado.

Fiscal: NotaFiscal, NotaFiscalItem, CFOP, NCM, CstPis, CstCofins, CstIcms, CstIpi, NaturezaOperacao, NaturezaMovimentacao, ModalidadeBcIcms, ModalidadeBcIcmsSt, DesoneracaoIcms, FinalidadeNFe, GrupoNumeracao, MensagemNF, Estado, Pais, ConfiguracaoFiscalEmpresa.

Pessoal: Colaborador, Jornada, Marcacao, TratamentoPonto, FechamentoPonto, AuditoriaPonto.

Infraestrutura: FilaEmail, FilaImportacao, Notificacao, RelatorioSalvo, ColunaConfigurada, QuadroPersonalizado, Anexo, LogAuditoria.

## 6. Fases de implementação

### Fase 0 - Fundação

Trocar o arquivo JSON por PostgreSQL com migrações; publicar o app num servidor da empresa ou VPS em vez de localhost, mantendo o modo local como contingência; perfis e permissões por tela e por ação; componente DataScreen genérico (listagem, filtros, colunas configuráveis, relatórios salvos, exportação CSV e PDF); anexos; log de auditoria; fila de e-mails; fila de importações.

### Fase 1 - Cadastros base

Empresa, Usuários, Perfis, Pessoas (cliente, fornecedor, outros), Produtos aproveitando o catálogo atual, Serviços, Categoria, Marca, Fabricante, Unidade, Série, Grade de Cores, Ambiente, Sistema, Local Produto, Conjunto de Produtos, Tabelas de Preço, Regra de Preço de Venda, Texto Padrão, Origem do Contato, Setor, Tipo de Profissional.

### Fase 2 - Comercial

Prospecção com funil e probabilidade; evoluir a proposta atual para o conceito de Projeto do AVA, com o ciclo orçamento para venda e as abas de Produtos, Serviços, Dimensões, Resultado e Cronograma; aprovação interna; Contrato e Cláusulas com assinatura do cliente, reaproveitando o aceite que já existe na proposta pública; Contrato Mensal e reajustes; Meta mensal e comissões; relatórios de faturamento e curvas ABC.

### Fase 3 - Projeto e Obra

Agenda e cadastro de visitas com notificações e validação de rota; fases e status de obra; processos com fases e conjuntos de tarefas; tarefas, recursos e pendências; pesquisa de satisfação; funil de projetos.

### Fase 4 - Compras e Estoque

Produtos a comprar gerados pela necessidade dos projetos; pedido de compra e entrada por nota; manifestação de NF-e; controle de estoque com locais, movimentações e histórico; separação e posição de entrega; curvas ABC de fornecedor, produto e estoque.

### Fase 5 - Financeiro

Contas a pagar e a receber com parcelas, carteiras, centros de custo e plano de contas; condições e formas de pagamento; cartões e contas fixas; créditos de cliente; conciliação bancária começando por importação de OFX e CNAB; fluxo de caixa diário, 30 dias e 12 meses; DRE.

### Fase 6 - Fiscal

Todas as tabelas fiscais; configuração fiscal por empresa; emissão de NF-e e NFS-e; guarda de XML e DANFE; relatório de produtos por nota e download de PDFs e XMLs por mês.

### Fase 7 - Ponto Eletrônico

Marcações, jornadas, tratamento, fechamento e exportações de auditoria nos formatos AFD e AEJ.

### Fase 8 - Quadro 360º e indicadores

Painel com quadros salvos, cartões, filtros por cliente, empresa e venda, colunas configuráveis, gráficos e agenda, atravessando todos os módulos.

## 7. Integrações externas e limites reais

Três itens não são apenas programação e precisam de decisão de negócio:

- NF-e e NFS-e exigem certificado digital A1 ou A3, homologação na SEFAZ e integração com o padrão da prefeitura de cada município. O caminho mais rápido é contratar um provedor de emissão via API em vez de implementar os webservices na mão.
- Open Finance e conciliação bancária automática exigem credenciamento nas instituições ou contrato com um agregador. Começar por importação manual de OFX e CNAB resolve a maior parte do uso.
- Ponto eletrônico tem exigência legal (Portaria 671/2021, arquivos AFD e AEJ). Se o ponto hoje é feito no AVA, vale manter lá até a Sona estar em conformidade.

## 8. Transição sem big bang

O conector src/AvaIntegration.tsx já importa catálogo. Ele deve ser ampliado para importar também pessoas (clientes e fornecedores), tabelas de preço e as tabelas fiscais, e para exportar da Sona para o AVA os projetos fechados enquanto financeiro e fiscal ainda estiverem no AVA. Assim cada fase entregue passa a ser a fonte da verdade daquele módulo e o AVA deixa de ser usado nele, sem virada única.

## 9. Critérios de aceite

Uma fase só é considerada pronta quando todas as telas listadas existem com listagem, filtros, cadastro e exportação; os dados equivalentes do AVA foram migrados e conferidos por amostragem; os relatórios daquele módulo batem com os do AVA para o mesmo período; e as permissões por perfil estão configuradas. A meta final é poder encerrar o contrato do AVA sem perda de função.
