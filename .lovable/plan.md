

## Plano: Correção Completa do Sistema de Autenticação

### DIAGNÓSTICO DOS PROBLEMAS

Após análise detalhada do código e banco de dados, identifiquei **4 problemas críticos**:

| Problema | Gravidade | Status Atual |
|----------|-----------|--------------|
| Emails nunca são enviados | CRÍTICO | Apenas `console.log()` |
| Aprovação não notifica usuário | ALTO | Usuário não sabe que foi aprovado |
| Token expirado não tem renovação | MÉDIO | Token expira em 15 min sem reenvio |
| Usuário aprovado sem senha | ALTO | Login impossível |

---

### SITUAÇÃO DO USUÁRIO `analist.com@outlook.com`

```text
Status no Banco de Dados:
├── user_id: 1d9b1d40-7fd2-464d-a9b2-fb2362db5948
├── status: active (FOI APROVADO pelo admin)
├── email_verified_at: NULL (nunca verificou)
├── token: f36582a5-79d1-4f40-a90c-d100ec0a359f
├── token_expires: 2026-01-11 20:21:43 (EXPIRADO)
└── used_at: NULL (nunca usado)

Problema: O usuário foi aprovado, mas nunca recebeu email,
então não pôde verificar email nem criar senha.
```

---

### FASE 1: Configurar Sistema de Envio de Email

**Pré-requisito: RESEND_API_KEY**

O sistema precisa de uma API key do Resend para enviar emails.

**Ação necessária do usuário:**
1. Criar conta em resend.com
2. Verificar domínio de email
3. Gerar API key
4. Fornecer a key para configuração

---

### FASE 2: Criar Edge Function para Envio de Email

**Novo arquivo:** `supabase/functions/send-verification-email/index.ts`

```typescript
// Funcionalidades:
// 1. Recebe user_id, email, token, tipo (verification/approval/reset)
// 2. Usa Resend para enviar email formatado
// 3. Templates diferentes para cada tipo de email
// 4. Logs de auditoria
```

**Tipos de email:**
- `email_verification`: Link para verificar email
- `account_approved`: Notificação de aprovação + link para login
- `password_reset`: Link para redefinir senha

---

### FASE 3: Atualizar Edge Function auth-register

**Arquivo:** `supabase/functions/auth-register/index.ts`

**Alterações:**
1. Remover `// TODO: Enviar email` (linha 121)
2. Chamar função de envio de email com token
3. Gerar URL completa de verificação

```typescript
// NOVO: Enviar email de verificação
const verificationUrl = `${Deno.env.get('SITE_URL')}/verify-email?token=${verificationToken}`;

await supabaseAdmin.functions.invoke('send-verification-email', {
  body: {
    to: email,
    type: 'email_verification',
    data: { verificationUrl, token: verificationToken }
  }
});
```

---

### FASE 4: Atualizar Edge Function admin-approve-user

**Arquivo:** `supabase/functions/admin-approve-user/index.ts`

**Alterações:**
1. Após aprovar, buscar email do usuário
2. Enviar email de notificação de aprovação
3. Se usuário não tiver senha, enviar link para criar

```typescript
// NOVO: Notificar usuário sobre aprovação
const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);

// Verifica se usuário tem senha
const needsPassword = !authUser?.user?.confirmed_at;

await supabaseAdmin.functions.invoke('send-verification-email', {
  body: {
    to: authUser.user.email,
    type: 'account_approved',
    data: { 
      loginUrl: `${Deno.env.get('SITE_URL')}/custom-login`,
      needsPassword,
      passwordResetUrl: needsPassword 
        ? `${Deno.env.get('SITE_URL')}/create-password?token=${newToken}` 
        : null
    }
  }
});
```

---

### FASE 5: Criar Função de Reenvio de Token

**Novo arquivo:** `supabase/functions/auth-resend-token/index.ts`

**Funcionalidades:**
1. Recebe email do usuário
2. Verifica se usuário existe e status
3. Gera novo token de verificação
4. Invalida tokens anteriores
5. Envia novo email

Isso resolve o problema de tokens expirados.

---

### FASE 6: Atualizar UI para Reenvio de Token

**Arquivo:** `src/pages/auth/VerifyEmail.jsx`

**Alterações:**
1. Adicionar botão "Reenviar token"
2. Input de email para reenvio
3. Cooldown de 60 segundos entre reenvios

---

### FASE 7: Correção Imediata para o Usuário Atual

**Problema específico de `analist.com@outlook.com`:**

O usuário foi aprovado mas nunca completou o fluxo. Para corrigir:

1. **Gerar novo token de verificação** via SQL ou função
2. **Marcar email como verificado** (já foi aprovado pelo admin)
3. **Permitir reset de senha** via link direto

**Solução técnica:**
Criar uma função `auth-admin-reset-user` que permite ao admin:
- Gerar link de reset de senha
- Enviar por email ao usuário

---

### FASE 8: Adicionar Secret SITE_URL

**Configuração necessária:**
```
SITE_URL = "https://compraouvenda.lovable.app"
```

Esta variável é necessária para gerar URLs corretas nos emails.

---

### RESUMO DE ARQUIVOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/send-verification-email/index.ts` | Criar | Função central de envio de emails |
| `supabase/functions/auth-register/index.ts` | Editar | Integrar envio de email |
| `supabase/functions/admin-approve-user/index.ts` | Editar | Notificar usuário aprovado |
| `supabase/functions/auth-resend-token/index.ts` | Criar | Reenvio de tokens expirados |
| `supabase/functions/auth-admin-reset-user/index.ts` | Criar | Admin pode resetar usuário |
| `src/pages/auth/VerifyEmail.jsx` | Editar | Adicionar opção de reenvio |
| `supabase/config.toml` | Editar | Adicionar novas funções |

---

### CONFIGURAÇÕES NECESSÁRIAS

Antes de implementar, você precisa fornecer:

1. **RESEND_API_KEY**: Chave da API do Resend
2. **Domínio verificado**: Ex: `noreply@cryptoanalytics.app`
3. **SITE_URL**: URL do site em produção

---

### FLUXO CORRIGIDO

```text
REGISTRO (Novo Fluxo)
┌──────────┐    ┌───────────┐    ┌──────────────┐
│ Register │───►│ auth-     │───►│ send-        │
│ (email)  │    │ register  │    │ verification │
└──────────┘    └───────────┘    │ -email       │
                                 └──────┬───────┘
                                        │
                                        ▼
                              📧 Email enviado
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Usuário clica   │
                              │ link no email   │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ verify-email    │
                              │ (marca used_at) │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ create-password │
                              │ (define senha)  │
                              └────────┬────────┘
                                       │
                                       ▼
                              Status: PENDING
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Admin aprova    │
                              │ (admin-approve) │
                              └────────┬────────┘
                                       │
                                       ▼
                              📧 Email: "Você foi aprovado!"
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Usuário faz     │
                              │ LOGIN           │
                              └─────────────────┘
```

---

### SOLUÇÃO IMEDIATA PARA analist.com@outlook.com

Enquanto o sistema de email não estiver implementado, podemos:

1. Criar função `auth-admin-reset-user` que gera um link temporário
2. Admin gera o link no painel
3. Admin envia manualmente o link ao usuário
4. Usuário acessa link e define senha
5. Usuário faz login

Isso resolve o problema imediato sem depender da configuração do Resend.

