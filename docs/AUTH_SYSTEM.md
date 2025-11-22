# Sistema de Autenticação e Autorização com Aprovação Manual

## Visão Geral

Sistema completo de autenticação com aprovação manual por administrador, seguindo o padrão **Entrada → Processamento → Saída**.

## Arquitetura

- **Modelo**: RBAC (Role-Based Access Control) com estados de conta
- **Estados**: `pending` (aguardando aprovação) → `active` (aprovado) → `blocked` (bloqueado)
- **Roles**: `pending`, `user`, `admin`, `moderator`
- **Segurança**: Argon2id (via Supabase Auth), tokens de verificação one-time, RLS policies

## Fluxo Completo

### 1. Cadastro de Usuário

**Entrada**: Email
**Processamento**: 
- Cria usuário com status `pending`
- Gera token de verificação (15 min de validade)
- Envia email (simulado em dev)

**Saída**: `202 Accepted` + token de verificação (modo dev)

**API**: `POST /auth/register`
```json
// Request
{ "email": "usuario@exemplo.com" }

// Response
{
  "message": "Verificação enviada se o e-mail for válido.",
  "_dev_token": "abc-123-def-456"
}
```

---

### 2. Verificação de Email

**Entrada**: Token de verificação
**Processamento**:
- Valida token (não usado, não expirado)
- Marca `email_verified_at`
- Invalida token (`used_at`)

**Saída**: `200 OK` + user_id para próxima etapa

**API**: `POST /auth/verify-email`
```json
// Request
{ "token": "abc-123-def-456" }

// Response
{
  "status": "email_verified",
  "next": "/create-password",
  "user_id": "uuid-do-usuario"
}
```

---

### 3. Criação de Senha

**Entrada**: Email, senha, user_id
**Processamento**:
- Valida email verificado
- Define senha (Argon2id via Supabase)
- Status permanece `pending`

**Saída**: `201 Created` + status da conta

**API**: `POST /auth/create-password`
```json
// Request
{
  "email": "usuario@exemplo.com",
  "password": "SenhaForte123!",
  "user_id": "uuid-do-usuario"
}

// Response
{
  "status": "password_set",
  "account_status": "pending",
  "message": "Senha criada. Aguardando aprovação de administrador."
}
```

---

### 4. Aprovação pelo Admin

**Entrada**: user_id, roles opcionais
**Processamento**:
- Verifica role admin do solicitante
- Altera status para `active`
- Atribui roles iniciais (default: `user`)
- Registra auditoria

**Saída**: `200 OK` + confirmação

**API**: `POST /admin/users/:id/approve`
```json
// Request
{
  "user_id": "uuid-do-usuario",
  "assigned_roles": ["user"]
}

// Response
{
  "userId": "uuid-do-usuario",
  "new_status": "active",
  "assigned_roles": ["user"]
}
```

---

### 5. Login

**Entrada**: Email, senha
**Processamento**:
- Autentica com Supabase Auth
- Verifica status da conta (`active` apenas)
- Emite access token (JWT curto) + refresh token
- Registra auditoria

**Saída**: `200 OK` + tokens + dados do usuário

**API**: `POST /auth/login`
```json
// Request
{
  "email": "usuario@exemplo.com",
  "password": "SenhaForte123!"
}

// Response (sucesso)
{
  "access_token": "eyJhbGciOiJSUzI1Ni...",
  "refresh_token": "rft_8f0af3...",
  "expires_in": 900,
  "token_type": "Bearer",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "roles": ["user"],
    "status": "active"
  }
}

// Response (conta pending)
{
  "error": "Sua conta está aguardando aprovação do administrador."
}

// Response (conta blocked)
{
  "error": "Sua conta foi bloqueada."
}
```

---

## Edge Functions

### Públicas (verify_jwt = false)
- `auth-register`: Cadastro de email
- `auth-verify-email`: Validação de token
- `auth-create-password`: Definição de senha
- `auth-custom-login`: Login customizado

### Protegidas (verify_jwt = true)
- `admin-list-pending-users`: Lista usuários pending (admin only)
- `admin-approve-user`: Aprova usuário (admin only)
- `admin-revoke-user`: Bloqueia usuário (admin only)
- `auth-refresh-token`: Renovação de token
- `auth-logout`: Logout e revogação

---

## Estrutura do Banco de Dados

### Tabelas Principais

1. **user_profiles**
   - `user_id`: UUID (FK para auth.users)
   - `status`: `pending | active | blocked`
   - `email_verified_at`: TIMESTAMPTZ

2. **user_roles**
   - `user_id`: UUID (FK para auth.users)
   - `role`: `pending | user | admin | moderator`
   - `tenant_id`: UUID (opcional, para multi-tenancy)

3. **verification_tokens**
   - `token`: TEXT (opaco, one-time)
   - `expires_at`: TIMESTAMPTZ
   - `used_at`: TIMESTAMPTZ

4. **audit_events**
   - `event_type`: TEXT
   - `user_id`: UUID
   - `actor_id`: UUID
   - `metadata`: JSONB
   - `result`: TEXT

### Funções de Segurança

- `has_role(user_id, role)`: Verifica se usuário tem role (security definer)
- `is_account_active(user_id)`: Verifica se conta está ativa

---

## Interfaces de Usuário

### Páginas Criadas

1. `/register`: Cadastro de email
2. `/verify-email`: Verificação de token
3. `/create-password`: Criação de senha
4. `/custom-login`: Login customizado
5. `/admin-panel`: Painel administrativo

---

## Como Criar o Primeiro Admin

**Importante**: O primeiro admin deve ser criado manualmente via SQL:

```sql
-- 1. Criar usuário via Supabase Auth Dashboard ou função
-- 2. Inserir role de admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('uuid-do-primeiro-admin', 'admin');

-- 3. Ativar conta
UPDATE public.user_profiles
SET status = 'active'
WHERE user_id = 'uuid-do-primeiro-admin';
```

Alternativamente, use o painel do Lovable Cloud:
1. Vá para **Backend** → **Database** → **Tables**
2. Crie um usuário em `auth.users` (ou use o existente)
3. Insira uma linha em `user_roles` com `role = 'admin'`
4. Atualize `user_profiles` para `status = 'active'`

---

## Auditoria

Todos os eventos são registrados em `audit_events`:

- `user_created`: Novo usuário cadastrado
- `email_verified`: Email verificado
- `password_created`: Senha definida
- `user_approved`: Usuário aprovado por admin
- `user_revoked`: Usuário bloqueado
- `login_success`: Login bem-sucedido
- `login_failed`: Tentativa de login falha
- `login_denied`: Login negado (status != active)
- `logout`: Logout realizado

---

## Segurança

### Proteções Implementadas

- **Senhas**: Argon2id via Supabase Auth
- **Tokens**: One-time use, curta duração (15 min)
- **Mensagens**: Neutras (não revelam existência de usuário)
- **RLS**: Policies restritivas em todas as tabelas
- **Auditoria**: Log completo de ações sensíveis
- **JWT**: Access token curto + refresh token rotativo

### Checklist de Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Security definer em funções privilegiadas
- ✅ Tokens opacos (não JWT) para verificação
- ✅ Validação de status em cada login
- ✅ Auditoria de eventos críticos
- ✅ Mensagens genéricas para evitar enumeração

---

## Testes

### Fluxo Completo

1. Acesse `/register` e cadastre email
2. Copie o token de desenvolvimento exibido
3. Acesse `/verify-email` e cole o token
4. Defina senha em `/create-password`
5. Admin acessa `/admin-panel` e aprova usuário
6. Usuário faz login em `/custom-login`

### Modo Desenvolvimento

Em desenvolvimento, tokens são exibidos na UI. **Remova `_dev_token` em produção!**

---

## Próximos Passos

- [ ] Integrar envio real de emails (Resend, SendGrid)
- [ ] Implementar MFA (2FA)
- [ ] Add reset de senha
- [ ] Notificações de aprovação por email
- [ ] Dashboard de auditoria para admins
- [ ] Rate limiting nas APIs públicas
