# SONA Propostas — código completo e instruções para o Claude

Este pacote contém a versão atual completa da plataforma SONA Propostas, incluindo interface, editor de propostas, orçamento, catálogo, editor de planta, aceite do cliente, banco de dados e arquivos visuais.

## Objetivo para o Claude

Use este projeto como a fonte principal. Não recrie uma demonstração simplificada: execute, preserve e evolua o sistema existente.

## Tecnologias atuais

- Next.js 16, React 19 e TypeScript
- Vinext/Vite para execução em Cloudflare Workers
- Cloudflare D1 (SQLite) para persistência
- Drizzle ORM e migrações SQL
- CSS responsivo em `app/globals.css`
- PDF.js para leitura de plantas em PDF
- Autenticação por cabeçalhos do ChatGPT Sites

## Funcionalidades já implementadas

- Login obrigatório e autorização administrativa por e-mail
- Criação, edição, salvamento e histórico de propostas
- Finalização, link público, envio e aceite digital pelo cliente
- Modelo visual SONA com duas fileiras pontilhadas no topo e no rodapé
- Tipografia personalizada incluída em `public/fonts/`
- Planos SMARTLIFE, VETRA e SCENARIO
- Inclusão de imagens na capa e em itens da proposta
- Editor semelhante ao Word, incluindo formatação e redimensionamento de imagens
- Geração de PDF pelo navegador
- Catálogo compartilhado de equipamentos e serviços
- Valores de compra, venda, margem, quantidade, desconto e total automático
- Criação, edição e exclusão de itens do catálogo e de orçamentos
- Editor técnico de planta com upload de imagem ou PDF
- Marcadores arrastáveis e redimensionáveis para iluminação, climatização, áudio, vídeo, rede, segurança e automação
- Imagens sobrepostas arrastáveis/redimensionáveis
- Legenda editável, análise inicial da legenda e mapa de calor Wi-Fi 2,4/5 GHz
- Conversão do escopo técnico em itens de proposta
- Layout responsivo para computador e celular

## Estrutura principal

```text
app/
  page.tsx                  entrada protegida do administrador
  admin-workspace.tsx       propostas e editor técnico de planta
  budget-workspace.tsx      catálogo, serviços e orçamento
  proposta/page.tsx         proposta pública e aceite do cliente
  api/budget/route.ts       API do catálogo e orçamento
  api/proposals/route.ts    API das propostas e aceite
  admin-access.ts           autorização administrativa
  chatgpt-auth.ts           autenticação do ChatGPT Sites
  globals.css               todo o design e responsividade
db/
  schema.ts                 tabelas Drizzle/D1
  catalog-seed.ts           catálogo inicial completo
drizzle/                    migrações SQL e metadados
public/                     imagens, ícones e fonte da proposta
worker/                     entrada do Cloudflare Worker
```

## Configuração necessária

1. Instale Node.js 22.13 ou superior.
2. Rode `npm ci`.
3. Configure um banco Cloudflare D1 com binding `DB`.
4. Copie `.env.example` para `.env.local` e informe os e-mails administrativos.
5. Substitua o valor de `project_id` em `.openai/hosting.json` se usar ChatGPT Sites. Em outra hospedagem, adapte a autenticação e o binding D1 sem alterar as regras de negócio.
6. Aplique as migrações da pasta `drizzle/` no D1.
7. Rode `npm run dev` para desenvolvimento.

No macOS, os scripts de instalação e build específicos do Sites podem depender de ferramentas GNU. Para trabalhar localmente, `npm ci` e `npm run dev` são suficientes. Para produção no Sites, use o fluxo de publicação da própria plataforma.

## Variáveis e acesso

```env
ADMIN_EMAILS=primeiro@empresa.com,segundo@empresa.com
```

Não coloque senhas no código. O acesso atual é controlado pela identidade do usuário e pela lista `ADMIN_EMAILS`.

## Regras que devem ser preservadas

- Não trocar VETRA por “Vertes”.
- Manter exatamente os três sistemas: SMARTLIFE, VETRA e SCENARIO.
- Preservar as duas fileiras pontilhadas no topo e no rodapé da proposta.
- Preservar a fonte incluída e o estilo geométrico, limpo e sofisticado.
- Não remover edição manual, salvamento de rascunho, finalização, compartilhamento ou aceite do cliente.
- Não remover o catálogo, orçamento, serviços, cálculo automático ou editor de planta.
- Não substituir persistência real por dados falsos ou somente `localStorage`.
- Manter boa experiência em computador e celular.

## Prompt pronto para enviar ao Claude

Copie e envie o texto abaixo junto com este arquivo ZIP:

> Abra e analise integralmente o projeto SONA Propostas fornecido. Ele é a versão funcional atual e deve ser usado como base, não como simples referência visual. Instale as dependências, entenda a arquitetura e execute o sistema. Preserve todas as funcionalidades existentes: autenticação administrativa, propostas com rascunho/finalização/compartilhamento/aceite, editor tipo Word, catálogo, equipamentos, serviços, orçamento com cálculos automáticos, planos SMARTLIFE/VETRA/SCENARIO, editor de planta com upload PDF/imagem, marcadores e imagens arrastáveis/redimensionáveis, legenda editável e mapa de calor Wi-Fi. Preserve também o padrão visual SONA, a fonte incluída e as duas fileiras pontilhadas no topo e no rodapé. Use o banco D1 e as migrações existentes; não transforme a plataforma em protótipo ou dados falsos. Primeiro faça o projeto executar sem regressões. Depois me mostre o resultado e pergunte quais alterações adicionais devo aplicar.

## Observação sobre dados

O pacote contém o código e a estrutura do banco, mas não exporta os registros privados já armazenados no banco da versão publicada. O catálogo inicial está incluído em `db/catalog-seed.ts` e será criado automaticamente.
