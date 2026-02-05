

## Plano: Correção do Sistema de Links de Acesso e Autenticação

### DIAGNÓSTICO DOS PROBLEMAS

```text
PROBLEMA 1: Link gera URL incorreta (404)
├── Causa: Edge Function usa URL hardcoded "compraouvenda.lovable.app"
├── Impacto: Preview usa URL diferente (id-preview--xxx.lovable.app)
└── Solução: Detectar ambiente automaticamente via header Origin

PROBLEMA 2: Autenticação "desaparece"
├── Causa: AdminPanel faz redirect via window.location.href (perde sessão React)
├── Impacto: Estado de autenticação não persiste entre navegações
└── Solução: Usar navigate() do React Router + listener de auth

PROBLEMA 3: Sessão não detectada corretamente
├── Causa: ProtectedRoute não usa onAuthStateChange
├── Impacto: Verificação de sessão ocorre apenas 1x no mount
└── Solução: Adicionar listener reativo para mudanças de auth
```

---

### CORREÇÃO 1: Edge Function com Detecção de Ambiente

**Arquivo:** `supabase/functions/auth-admin-reset-user/index.ts`

**Alterações:**
- Receber header `Origin` ou `Referer` da requisição
- Usar a mesma base URL de onde o admin está acessando
- Fallback para SITE_URL se não detectar origem

```typescript
// ANTES (linha 165):
const siteUrl = Deno.env.get('SITE_URL') || 'https://compraouvenda.lovable.app';

// DEPOIS:
const origin = req.headers.get('Origin') || req.headers.get('Referer');
const siteUrl = origin 
  ? new URL(origin).origin 
  : (Deno.env.get('SITE_URL') || 'https://compraouvenda.lovable.app');
```

Isso garante que se o admin está no preview, o link gerado será do preview.

---

### CORREÇÃO 2: AdminPanel com Navegação React

**Arquivo:** `src/pages/auth/AdminPanel.jsx`

**Alterações:**
- Substituir `window.location.href = '/custom-login'` por `navigate('/custom-login')`
- Adicionar listener `onAuthStateChange` para manter sessão reativa
- Evitar verificações redundantes de sessão

```typescript
// ANTES (linha 45):
window.location.href = '/custom-login';

// DEPOIS:
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/custom-login');
```

---

### CORREÇÃO 3: ProtectedRoute com Listener Reativo

**Arquivo:** `src/components/common/ProtectedRoute.jsx`

**Alterações:**
- Adicionar `onAuthStateChange` para reagir a mudanças de autenticação
- Ordem correta: listener primeiro, depois getSession
- Evitar race conditions no carregamento

```typescript
useEffect(() => {
  // 1. Setup listener PRIMEIRO
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAccountStatus(session.user.id);
      } else {
        setAccountStatus(null);
      }
      setLoading(false);
    }
  );

  // 2. DEPOIS verifica sessão existente
  checkAuth();

  return () => subscription.unsubscribe();
}, []);
```

---

### CORREÇÃO 4: Modal de Link com Feedback Visual

**Arquivo:** `src/pages/auth/AdminPanel.jsx`

**Alterações:**
- Mostrar URL completa de forma legível
- Adicionar validação visual de que o link foi copiado
- Feedback de sucesso mais claro

---

### RESUMO DE ARQUIVOS A MODIFICAR

| Arquivo | Alteração | Descrição |
|---------|-----------|-----------|
| `supabase/functions/auth-admin-reset-user/index.ts` | Editar | Detectar ambiente via header Origin |
| `src/pages/auth/AdminPanel.jsx` | Editar | Usar navigate() + melhorar feedback |
| `src/components/common/ProtectedRoute.jsx` | Editar | Adicionar listener onAuthStateChange |
| `src/pages/auth/CustomLogin.jsx` | Editar | Usar navigate() em vez de window.location |

---

### FLUXO CORRIGIDO

```text
ADMIN GERA LINK (Novo Fluxo)
┌─────────────────────────────────────────────────────────────────┐
│  Admin acessa /admin-panel (preview ou publicado)               │
│                          │                                      │
│                          ▼                                      │
│  Clica "Gerar Link" → Edge Function recebe header Origin        │
│                          │                                      │
│                          ▼                                      │
│  Edge Function usa MESMA URL do admin para gerar link:          │
│  ├── Preview: https://id-preview--xxx.lovable.app/set-password  │
│  └── Prod: https://compraouvenda.lovable.app/set-password       │
│                          │                                      │
│                          ▼                                      │
│  Admin copia link → Envia ao usuário                            │
│                          │                                      │
│                          ▼                                      │
│  Usuário acessa link → Página SetPassword abre corretamente     │
│                          │                                      │
│                          ▼                                      │
│  Usuário define senha → Login habilitado                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### TESTES RECOMENDADOS

Após implementação:

1. **Teste de geração de link:**
   - Acessar admin-panel no preview
   - Gerar link para usuário
   - Verificar se URL contém preview (não produção)

2. **Teste de acesso ao link:**
   - Copiar link gerado
   - Abrir em nova aba anônima
   - Verificar se página SetPassword carrega

3. **Teste de definição de senha:**
   - Preencher formulário de senha
   - Submeter
   - Verificar redirecionamento para login

4. **Teste de autenticação persistente:**
   - Fazer login como admin
   - Navegar entre páginas
   - Verificar se sessão permanece ativa

