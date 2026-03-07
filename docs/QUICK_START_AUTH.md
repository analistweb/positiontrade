# Quick Start - Sistema de Autenticação

## Passo a Passo para Testar

### 1. Criar o Primeiro Admin

**Opção A: Via SQL (recomendado)**

Execute no SQL Editor do Supabase (Dashboard do projeto):

```sql
-- Substitua 'admin@example.com' pelo email desejado
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Cria usuário admin (você precisará definir senha via Supabase Auth UI)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('SuaSenhaForteAqui123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO admin_user_id;

  -- Define status como active
  UPDATE public.user_profiles
  SET status = 'active', email_verified_at = now()
  WHERE user_id = admin_user_id;

  -- Atribui role de admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin');

  RAISE NOTICE 'Admin criado com sucesso! ID: %', admin_user_id;
END $$;
```

**Opção B: Via interface do Supabase**

1. Abra o projeto no Dashboard → **Authentication** → **Users** (e/ou **Table Editor** → **auth.users**)
2. Crie um usuário manualmente
3. Copie o `id` do usuário
4. Em **user_profiles**: Atualize `status = 'active'`
5. Em **user_roles**: Insira `{ user_id: "uuid-copiado", role: "admin" }`

---

### 2. Testar Fluxo de Cadastro

**2.1. Registrar Novo Usuário**

1. Acesse: `http://localhost:5173/register`
2. Digite email: `teste@exemplo.com`
3. Clique "Criar Conta"
4. **Copie o token exibido** (modo dev)

**2.2. Verificar Email**

1. Acesse: `http://localhost:5173/verify-email`
2. Cole o token copiado
3. Clique "Verificar Email"
4. Será redirecionado para criação de senha

**2.3. Criar Senha**

1. Digite o email novamente: `teste@exemplo.com`
2. Crie uma senha forte (mín. 8 caracteres)
3. Confirme a senha
4. Clique "Criar Senha"
5. Mensagem aparecerá: "Aguardando aprovação do administrador"

---

### 3. Aprovar Usuário (Admin)

**3.1. Login como Admin**

1. Acesse: `http://localhost:5173/custom-login`
2. Digite credenciais do admin criado no Passo 1
3. Clique "Entrar"
4. Será redirecionado para `/admin-panel`

**3.2. Aprovar Usuário Pendente**

1. No painel admin, veja lista de usuários pending
2. Localize `teste@exemplo.com`
3. Clique botão "Aprovar" (✓)
4. Confirmação: "Usuário aprovado com sucesso!"

---

### 4. Login do Usuário Aprovado

**4.1. Fazer Login**

1. Acesse: `http://localhost:5173/custom-login`
2. Digite: `teste@exemplo.com` + senha criada
3. Clique "Entrar"
4. **Sucesso!** Redirecionado para página principal

**4.2. Testar Bloqueio (Opcional)**

1. No admin panel, clique "Bloquear" (X) em um usuário
2. Tente fazer login com esse usuário
3. Mensagem: "Sua conta foi bloqueada"

---

## Verificando Edge Functions

### Listar Functions Deployadas

No Dashboard do Supabase, vá em **Edge Functions** e veja:

- ✅ auth-register
- ✅ auth-verify-email
- ✅ auth-create-password
- ✅ admin-list-pending-users
- ✅ admin-approve-user
- ✅ admin-revoke-user
- ✅ auth-custom-login
- ✅ auth-refresh-token
- ✅ auth-logout

### Testar Edge Function Diretamente

```bash
# Via curl (exemplo: register)
curl -X POST https://gunkkcdtsibxhspkjweu.supabase.co/functions/v1/auth-register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com"}'
```

---

## Auditoria

Ver eventos de auditoria:

```sql
SELECT 
  event_type,
  user_id,
  actor_id,
  metadata,
  timestamp
FROM public.audit_events
ORDER BY timestamp DESC
LIMIT 20;
```

---

## Troubleshooting

### Erro: "Token inválido ou expirado"

- Tokens expiram em 15 minutos
- Refaça o cadastro para gerar novo token

### Erro: "Acesso negado"

- Verifique se conta está com `status = 'active'`
- Confirme que admin tem role correta em `user_roles`

### Erro: "Email não verificado"

- Complete o passo de verificação de email antes de criar senha

### Functions não aparecem

- Verifique `supabase/config.toml`
- Deploy pode levar 1-2 minutos

---

## Produção

### Remover Modo Dev

Em `supabase/functions/auth-register/index.ts`, remova:

```typescript
// Remover esta linha em produção!
_dev_token: verificationToken
```

### Integrar Envio de Email

Substitua `console.log` por serviço de email (Resend, SendGrid):

```typescript
// TODO: Enviar email com link de verificação
const verificationLink = `${Deno.env.get('APP_URL')}/verify-email?token=${verificationToken}`;
await sendEmail(email, 'Verifique seu email', verificationLink);
```

---

## URLs de Referência

- Cadastro: `/register`
- Verificação: `/verify-email`
- Criar Senha: `/create-password`
- Login: `/custom-login`
- Admin: `/admin-panel`

---

## Próximas Melhorias

- [ ] Envio real de emails
- [ ] Reset de senha
- [ ] MFA (2FA)
- [ ] Dashboard de auditoria completo
- [ ] Rate limiting
