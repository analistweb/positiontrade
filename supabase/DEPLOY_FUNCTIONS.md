# Deploy das Edge Functions no Supabase

O erro **"Failed to send a request to the Edge Function"** com **404** acontece quando as funções existem só no código e **não estão publicadas no projeto Supabase** que você está usando no `.env`.

O front chama `https://<seu-projeto>.supabase.co/functions/v1/auth-create-first-admin`. Se essa função não foi implantada nesse projeto, o servidor responde 404.

## Passo a passo (novo projeto)

### 1. Instalar e fazer login no Supabase CLI

```bash
# Instalar (se ainda não tiver)
npm install -g supabase

# Login no Supabase (abre o navegador)
supabase login
```

### 2. Vincular ao projeto correto

No terminal, na raiz do repositório:

```bash
cd /Users/tiago/HTML/compraouvenda
supabase link --project-ref mpeukrbbbdmppcctzwcw
```

Quando pedir, informe a **database password** do projeto (a que você definiu no painel do Supabase).  
O **Project ref** é a parte do seu URL: `https://mpeukrbbbdmppcctzwcw.supabase.co` → `mpeukrbbbdmppcctzwcw`.

### 3. Definir secrets (variáveis para as funções)

As Edge Functions usam variáveis de ambiente do Supabase. Configure no painel:

- **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Garanta que existam (com os valores do **novo** projeto):

- `SUPABASE_URL` → `https://mpeukrbbbdmppcctzwcw.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` → chave **service_role** do novo projeto
- `SUPABASE_ANON_KEY` → chave **anon** do novo projeto

Ou via CLI (substitua pelos valores reais):

```bash
supabase secrets set SUPABASE_URL=https://mpeukrbbbdmppcctzwcw.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
supabase secrets set SUPABASE_ANON_KEY=sua_anon_key
```

### 4. Fazer deploy de todas as funções

```bash
supabase functions deploy auth-create-first-admin
supabase functions deploy auth-register
supabase functions deploy auth-verify-email
supabase functions deploy auth-create-password
supabase functions deploy auth-custom-login
supabase functions deploy auth-set-password
supabase functions deploy auth-admin-reset-user
supabase functions deploy auth-refresh-token
supabase functions deploy auth-logout
supabase functions deploy admin-verify-role
supabase functions deploy admin-list-pending-users
supabase functions deploy admin-approve-user
supabase functions deploy admin-revoke-user
supabase functions deploy fetch-market-news
supabase functions deploy fetch-liquidation-data
supabase functions deploy fetch-asset-data
```

Ou deploy de uma vez (todas as funções na pasta `supabase/functions`):

```bash
supabase functions deploy
```

### 5. Testar de novo

1. Abra `/create-first-admin`.
2. Clique em **Criar Administrador**.
3. Se o deploy estiver correto e as migrations do novo DB aplicadas, a criação do admin deve concluir sem 404.

## Resumo do problema

| Onde está | Situação |
|-----------|----------|
| Código (`.env`) | Apontando para o **novo** projeto (`mpeukrbbbdmppcctzwcw`) |
| Banco (migrations) | Provavelmente já aplicadas no novo projeto |
| Edge Functions | Só no repositório; **não** publicadas no novo projeto → **404** |

Depois do `supabase link` + `supabase functions deploy` no projeto `mpeukrbbbdmppcctzwcw`, as chamadas do front passarão a acertar as funções nesse projeto e o erro deve sumir.
