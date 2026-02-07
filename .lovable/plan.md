

## Diagnóstico: Erro de Login do Usuário `analist.com@outlook.com`

### ANÁLISE TÉCNICA

```text
INVESTIGAÇÃO REALIZADA
├── Teste direto da Edge Function: FUNCIONA (retorna 401 para senha errada)
├── Configuração TOML: verify_jwt = false (correto)
├── Status do usuário no banco:
│   ├── status: 'active' ✓
│   ├── email_verified_at: 2026-02-05 ✓
│   ├── has_password: true ✓
│   └── roles: NULL ⚠️ (sem role atribuído)
└── Análise do erro reportado:
    └── "Edge Function returned a non-2xx status code" + RUNTIME_ERROR
```

### PROBLEMA IDENTIFICADO: Headers CORS Incompletos

O SDK do Supabase envia automaticamente headers adicionais que não estão sendo permitidos:

```text
HEADERS ATUAIS (insuficientes):
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'

HEADERS NECESSÁRIOS:
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, 
  x-supabase-client-platform, x-supabase-client-platform-version, 
  x-supabase-client-runtime, x-supabase-client-runtime-version'
```

Quando o browser faz o **preflight request (OPTIONS)** e recebe uma resposta que não permite os headers que o SDK pretende enviar, o browser **bloqueia a requisição principal**.

---

### CORREÇÕES NECESSÁRIAS

#### 1. Atualizar CORS Headers em Todas as Edge Functions

**Arquivos afetados:**
- `supabase/functions/auth-custom-login/index.ts`
- `supabase/functions/auth-register/index.ts`
- `supabase/functions/auth-verify-email/index.ts`
- `supabase/functions/auth-create-password/index.ts`
- `supabase/functions/auth-set-password/index.ts`
- `supabase/functions/auth-create-first-admin/index.ts`
- `supabase/functions/admin-verify-role/index.ts`
- `supabase/functions/admin-list-pending-users/index.ts`
- `supabase/functions/admin-approve-user/index.ts`
- `supabase/functions/admin-revoke-user/index.ts`
- `supabase/functions/auth-admin-reset-user/index.ts`
- `supabase/functions/auth-refresh-token/index.ts`
- `supabase/functions/auth-logout/index.ts`

**Alteração em cada arquivo:**
```typescript
// DE:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PARA:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

#### 2. Atribuir Role ao Usuário (via migration)

O usuário `analist.com@outlook.com` (ID: `131c6b8a-04f1-4483-82b1-3af0bcdee339`) não tem role. Precisa inserir na tabela `user_roles`:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('131c6b8a-04f1-4483-82b1-3af0bcdee339', 'user')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### FLUXO DE LOGIN CORRIGIDO

```text
ANTES (erro):
┌──────────────────────────────────────────────────────────────┐
│  Browser envia OPTIONS preflight                             │
│                    │                                         │
│                    ▼                                         │
│  Edge Function retorna CORS headers incompletos              │
│                    │                                         │
│                    ▼                                         │
│  Browser BLOQUEIA requisição POST (CORS error)               │
│                    │                                         │
│                    ▼                                         │
│  CustomLogin.jsx recebe erro genérico                        │
│  → "Edge Function returned a non-2xx status code"            │
└──────────────────────────────────────────────────────────────┘

DEPOIS (corrigido):
┌──────────────────────────────────────────────────────────────┐
│  Browser envia OPTIONS preflight                             │
│                    │                                         │
│                    ▼                                         │
│  Edge Function retorna CORS headers COMPLETOS                │
│                    │                                         │
│                    ▼                                         │
│  Browser PERMITE requisição POST                             │
│                    │                                         │
│                    ▼                                         │
│  Edge Function valida credenciais                            │
│                    │                                         │
│                    ▼                                         │
│  Login bem-sucedido → sessão estabelecida                    │
└──────────────────────────────────────────────────────────────┘
```

---

### RESUMO DE ALTERAÇÕES

| Arquivo | Tipo | Alteração |
|---------|------|-----------|
| `auth-custom-login/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-register/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-verify-email/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-create-password/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-set-password/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-create-first-admin/index.ts` | Edge Function | Atualizar corsHeaders |
| `admin-verify-role/index.ts` | Edge Function | Atualizar corsHeaders |
| `admin-list-pending-users/index.ts` | Edge Function | Atualizar corsHeaders |
| `admin-approve-user/index.ts` | Edge Function | Atualizar corsHeaders |
| `admin-revoke-user/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-admin-reset-user/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-refresh-token/index.ts` | Edge Function | Atualizar corsHeaders |
| `auth-logout/index.ts` | Edge Function | Atualizar corsHeaders |
| Banco de dados | Migration | Atribuir role 'user' ao usuário |

---

### TESTE APÓS IMPLEMENTAÇÃO

1. **Teste de login:**
   - Acessar `/custom-login`
   - Inserir email: `analist.com@outlook.com`
   - Inserir senha definida anteriormente
   - Verificar login bem-sucedido

2. **Verificar console do browser:**
   - Não deve haver erros de CORS
   - Requisição POST deve retornar 200

