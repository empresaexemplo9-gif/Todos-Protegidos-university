# Integração Power CRM → Todos Protegidos University

Faz os dados do **Power CRM** (cotação, cadastro de cliente, vistoria liberada,
contrato de adesão) entrarem **automaticamente** na plataforma, numa área nova
de **Operação (CRM)**.

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

### 2. Publicar a função (Supabase CLI)
No computador, com o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado:
```bash
supabase login
supabase link --project-ref SEU-PROJECT-REF
supabase functions deploy powercrm-webhook --no-verify-jwt
```
> `--no-verify-jwt` é necessário porque o Power CRM não envia token JWT do Supabase —
> a autenticação é feita pelo nosso próprio token (passo 3).

### 3. Definir os segredos
```bash
supabase secrets set POWERCRM_WEBHOOK_TOKEN="escolha-um-token-secreto-forte"
# opcional (padrão já é "matriz"):
supabase secrets set POWERCRM_TENANT_SLUG="matriz"
```
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados automaticamente nas funções.

### 4. Configurar o webhook no Power CRM
No Power CRM, em **Webhooks**, adicione um webhook para cada evento que quiser capturar
(cotação criada/aceita, cadastro, vistoria, contrato), apontando para:
```
https://SEU-PROJECT-REF.functions.supabase.co/powercrm-webhook?token=O-MESMO-TOKEN-DO-PASSO-3
```
(Se o Power CRM tiver um campo "token" próprio, pode usar esse campo em vez do `?token=` na URL.)

### 5. Refinar o mapeamento (depois do 1º webhook real)
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
