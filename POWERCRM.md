# Integração Power CRM → Todos Protegidos University

Faz os dados do **Power CRM** (cotação, cadastro de cliente, vistoria liberada,
contrato de adesão) entrarem **automaticamente** na plataforma, numa área nova
de **Operação (CRM)**.

## ⚠️ Antes de tudo: cada arquivo tem o seu lugar

No Supabase existem duas telas diferentes, e trocá-las gera erro:

| Arquivo | Onde colar | O que acontece se errar |
|---|---|---|
| `.sql` (ex.: `crm.sql`) | **SQL Editor** | — |
| `.ts` (ex.: `functions/powercrm-webhook/index.ts`) | **Edge Functions → Deploy a new function → Via Editor** | O SQL Editor acusa `syntax error at or near "//"` |

O código da função é TypeScript, não SQL: o SQL Editor não sabe lê-lo.

## Como funciona
```
Power CRM  ──(webhook, com token)──►  Edge Function "powercrm-webhook" (Supabase)
                                              │ grava
                                              ▼
                         Tabelas crm_* no Supabase  ──►  página "Operação (CRM)"
```
- A vistoria continua sendo feita no app **Visto**; o Power CRM envia o evento de
  **vistoria liberada** com o **link e o código** do Visto, que ficam registrados aqui.
- Os segredos (token do Power CRM) ficam **no servidor** (Edge Function), nunca no
  site público.

## O que JÁ está pronto no repositório
- `supabase/crm.sql` — tabelas + segurança (RLS).
- `supabase/functions/powercrm-webhook/index.ts` — recebe e grava os webhooks.
- Página **Operação (CRM)** (`operacao.html`) + item no menu (só admin/presidente).

## O que você precisa fazer (passos que exigem o seu login)

### 1. Criar as tabelas
No **SQL Editor** do Supabase, rode `supabase/crm.sql`.

### 2. Publicar a função

**Opção A — pelo navegador (sem instalar nada):**
1. No Supabase, abra **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nome: `powercrm-webhook`.
3. Cole o conteúdo de `supabase/functions/powercrm-webhook/index.ts`.
4. Desmarque **Verify JWT** (o Power CRM não envia token do Supabase; quem autentica é o nosso token).
5. **Deploy**.

**Opção B — pelo Supabase CLI:**
```bash
supabase login
supabase link --project-ref SEU-PROJECT-REF
supabase functions deploy powercrm-webhook --no-verify-jwt
```

### 3. Definir os segredos
```bash
supabase secrets set POWERCRM_WEBHOOK_TOKEN="escolha-um-token-secreto-forte"
# opcional (padrão já é "todosprotegidos" — o código da empresa):
supabase secrets set POWERCRM_TENANT_SLUG="todosprotegidos"
```
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados automaticamente nas funções.

### 4. Configurar o webhook no Power CRM
No Power CRM, em **Webhooks**, adicione um webhook para cada evento que quiser capturar
(cotação criada/aceita, cadastro, vistoria, contrato), apontando para:
```
https://SEU-PROJECT-REF.supabase.co/functions/v1/powercrm-webhook?apikey=SUA-ANON-KEY&token=O-MESMO-TOKEN-DO-PASSO-3
```
(Se o Power CRM tiver um campo "token" próprio, pode usar esse campo em vez do `?token=` na URL.)

> **Por que a `apikey` vai na URL:** com "Verify JWT" ligado — o padrão do
> Supabase — o porteiro recusa a chamada antes de chegar na função, com
> `UNAUTHORIZED_NO_AUTH_HEADER`. A chave **anon** na URL satisfaz o porteiro sem
> precisar mexer nessa configuração e sem o Power CRM ter de enviar cabeçalhos.
> Ela é pública (já vai no site) e não dá acesso a nada: quem protege o webhook
> é o `?token=`, conferido dentro da função. O painel já monta a URL completa
> para você em **Operação (CRM) → Conexão com o Power CRM → Copiar**.

### 5. Conferir a ligação na própria plataforma
Entre como administrador em **Operação (CRM)**. No topo há o cartão
**"Conexão com o Power CRM"**:
- mostra a **URL do webhook** já montada com o seu projeto (botão **Copiar**);
- o botão **Testar conexão** faz uma chamada real à função e responde na hora:
  token recusado, função ainda não publicada, empresa não encontrada, ou
  **"Conexão certa"**.

O token digitado aí serve só para o teste — não fica salvo em lugar nenhum.

---

## Saída: usar a API do Power CRM (plataforma → CRM)

Para a plataforma **enviar** dados (ex.: `POST /api/quotation/add`), existe uma
segunda função: `supabase/functions/powercrm-api/index.ts`.

Ela é uma **ponte**: o token da API fica no servidor, nunca no navegador, e ela
resolve o CORS (a API do Power CRM não libera o nosso domínio). Só passa quem
está logado **e** é administrador — a checagem é feita no banco.

```bash
supabase functions deploy powercrm-api          # com Verify JWT LIGADO
supabase secrets set POWERCRM_API_TOKEN="o-token-da-sua-conta"
```
Se a API do Power CRM usar outro formato de autenticação, dá para ajustar sem
mexer no código:
```bash
supabase secrets set POWERCRM_AUTH_HEADER="authorization"   # ex.: "x-api-key"
supabase secrets set POWERCRM_AUTH_PREFIX="Bearer "         # ex.: "" (vazio)
supabase secrets set POWERCRM_API_BASE="https://api.powercrm.com.br/api"
```

Caminhos liberados hoje: `quotation/add`, `quotation/list`, `customer/add`,
`lead/add` (a lista fica no início do arquivo da função, para a ponte não virar
um proxy aberto).

### 6. Refinar o mapeamento (depois do 1º webhook real)
A função guarda **todo** webhook bruto na tabela `crm_eventos` (coluna `payload`).
Assim que o primeiro evento real chegar:
1. Veja o conteúdo de `crm_eventos` no Supabase (SQL: `select payload from crm_eventos order by recebido_em desc limit 5;`).
2. Me mande esse JSON — eu ajusto o mapeamento de campos da função para bater **exatamente**
   com o formato do Power CRM (nomes de campos, status, etc.).

## Segurança
- O endpoint valida o **token**; sem o token correto, devolve 401.
- A escrita nas tabelas é feita pela função com a **service role** (servidor); o site
  público só **lê** (e só admin/presidente, via RLS).
- Nunca coloque o token nem a service role no front-end.

## Status atual
Enquanto o webhook não estiver configurado, a página **Operação (CRM)** mostra
"Aguardando dados do Power CRM". Assim que os eventos começarem a chegar, as tabelas
de cotações, clientes, vistorias e contratos se preenchem sozinhas.
