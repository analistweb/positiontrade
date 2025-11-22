# Como Criar o Primeiro Administrador

Este guia explica como criar o primeiro usuário administrador do sistema.

## Método: Via Lovable Cloud Backend

### Passo 1: Criar Usuário no Auth

1. Acesse o backend do Lovable Cloud
2. Vá em **Users & Authentication** → **Users**
3. Clique em **Add User**
4. Preencha:
   - **Email**: admin@seudominio.com (use um email real que você controla)
   - **Password**: Crie uma senha forte com 12+ caracteres
   - **Auto Confirm User**: ✅ Marque esta opção
5. Clique em **Create User**
6. **IMPORTANTE**: Copie o UUID do usuário criado (você vai precisar dele)

### Passo 2: Executar SQL para Promover a Admin

1. No Lovable Cloud Backend, vá em **Database** → **SQL Editor**
2. Cole o script abaixo, **substituindo** `SEU_USER_ID_AQUI` pelo UUID que você copiou:

```sql
-- Substitua 'SEU_USER_ID_AQUI' pelo UUID do usuário
-- Substitua 'admin@seudominio.com' pelo email do usuário

-- Atualiza perfil para status 'active'
UPDATE public.user_profiles
SET 
  status = 'active',
  email_verified_at = now()
WHERE user_id = 'SEU_USER_ID_AQUI';

-- Adiciona role 'admin'
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID_AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Log de auditoria
INSERT INTO public.audit_events (event_type, user_id, metadata, result)
VALUES (
  'admin_created',
  'SEU_USER_ID_AQUI',
  '{"email": "admin@seudominio.com", "method": "manual_script"}'::jsonb,
  'success'
);
```

3. Clique em **Run** para executar o script

### Passo 3: Verificar

1. Vá para a aplicação em `/custom-login`
2. Faça login com o email e senha do admin
3. Você deve ser redirecionado para `/admin-panel`
4. Agora você pode aprovar outros usuários!

---

## ⚠️ Importante

- Este processo só precisa ser feito **UMA VEZ** para criar o primeiro admin
- Depois disso, outros admins podem ser criados através do painel administrativo
- **Nunca compartilhe as credenciais do admin**
- Use uma senha forte e única para o admin

---

## Troubleshooting

### "Email já existe"
- O usuário já foi criado. Vá direto para o Passo 2.

### "Token inválido ou expirado"
- Este erro aparece se você tentar usar o fluxo normal de registro. O primeiro admin deve ser criado manualmente.

### "Acesso negado" ao tentar acessar o painel
- Verifique se você executou o SQL do Passo 2 corretamente
- Confirme que o UUID está correto (sem aspas extras, sem espaços)

### Ainda não consigo acessar
- Verifique se o `status` está como `'active'` na tabela `user_profiles`
- Verifique se existe uma entrada com `role = 'admin'` na tabela `user_roles` para seu `user_id`
