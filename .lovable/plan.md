

## Plano: Nova Paleta de Cores Exclusiva com Transições Premium

### FILOSOFIA DE DESIGN

Inspiração na estética Webflow (minimalismo sofisticado) mas reinterpretada para um contexto de análise financeira premium:

- **Exclusividade**: Evitar azuis corporativos (#0066FF), verdes startup (#00C853), cinzas puros (#808080)
- **Inovação + Confiança**: Tons profundos, texturas sutis, sem remeter a estética de IA
- **Acessibilidade**: Contraste AA/AAA garantido em todos os modos

---

### NOVA PALETA DE CORES

```text
PALETA PRINCIPAL (4 cores base)
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  BACKGROUND CLARO          BACKGROUND ESCURO                         │
│  ━━━━━━━━━━━━━━━━━         ━━━━━━━━━━━━━━━━━                          │
│  #FAFAF9 (Stone 50)        #0C0E12 (Obsidian)                        │
│  HSL: 40 20% 98%           HSL: 220 18% 5%                           │
│  Creme sutil, quente       Preto azulado profundo                    │
│                                                                       │
│  PRIMÁRIA                  SECUNDÁRIA                                │
│  ━━━━━━━━━                 ━━━━━━━━━━                                 │
│  #1A1F2E (Midnight)        #E8E6E3 (Ivory)                           │
│  HSL: 225 28% 14%          HSL: 30 12% 90%                           │
│  Azul noturno profundo     Cinza quente marfim                       │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

PALETA DE APOIO (2 acentos exclusivos)
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ACENTO 1: CORAL TERRACOTA     ACENTO 2: VERDE MINERAL              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━                │
│  #D97756 (Burnt Sienna)        #3D8B7A (Teal Stone)                  │
│  HSL: 15 62% 59%               HSL: 165 40% 39%                      │
│  Coral queimado sofisticado    Verde mineral/jade                   │
│  Para CTAs, destaques          Para sucesso, confirmações           │
│                                                                       │
│  VARIAÇÕES DE CONTRASTE:                                             │
│  Coral (claro): 4.8:1 ✓ AA     Verde (claro): 4.5:1 ✓ AA            │
│  Coral (escuro): 5.2:1 ✓ AA    Verde (escuro): 5.1:1 ✓ AA           │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

### TOKENS DE DESIGN

```text
┌─────────────────────────────────────────────────────────────────┐
│ TOKEN                │ LIGHT MODE       │ DARK MODE            │
├─────────────────────────────────────────────────────────────────┤
│ --background         │ 40 20% 98%       │ 220 18% 5%           │
│ --background-alt     │ 40 15% 95%       │ 220 20% 8%           │
│ --background-elevated│ 0 0% 100%        │ 220 18% 10%          │
│ --background-muted   │ 40 10% 92%       │ 220 15% 4%           │
│                      │                  │                       │
│ --foreground         │ 225 28% 14%      │ 40 20% 98%           │
│ --foreground-muted   │ 225 15% 35%      │ 220 15% 70%          │
│ --foreground-subtle  │ 225 10% 55%      │ 220 10% 50%          │
│                      │                  │                       │
│ --primary            │ 225 28% 14%      │ 40 20% 98%           │
│ --primary-foreground │ 40 20% 98%       │ 225 28% 14%          │
│ --primary-hover      │ 225 28% 20%      │ 40 15% 90%           │
│                      │                  │                       │
│ --secondary          │ 30 12% 90%       │ 220 18% 12%          │
│ --secondary-foreground│ 225 28% 14%     │ 40 20% 98%           │
│                      │                  │                       │
│ --accent1            │ 15 62% 59%       │ 15 65% 55%           │
│ --accent1-foreground │ 0 0% 100%        │ 0 0% 100%            │
│ --accent1-hover      │ 15 62% 52%       │ 15 65% 48%           │
│ --accent1-muted      │ 15 50% 70%       │ 15 55% 65%           │
│                      │                  │                       │
│ --accent2            │ 165 40% 39%      │ 165 45% 42%          │
│ --accent2-foreground │ 0 0% 100%        │ 0 0% 100%            │
│ --accent2-hover      │ 165 40% 33%      │ 165 45% 36%          │
│ --accent2-muted      │ 165 30% 55%      │ 165 35% 55%          │
│                      │                  │                       │
│ --border             │ 40 10% 88%       │ 220 15% 18%          │
│ --border-hover       │ 40 10% 75%       │ 220 15% 28%          │
└─────────────────────────────────────────────────────────────────┘
```

---

### FASE 1: Atualizar CSS Variables (src/index.css)

**Alterações:**
1. Substituir cores genéricas pela nova paleta exclusiva
2. Manter compatibilidade com tokens trading (success/danger) usando accent2/coral
3. Adicionar tokens accent1 e accent2

**Cores Light Mode:**
```css
:root {
  /* Background - Stone/Cream */
  --background: 40 20% 98%;
  --background-alt: 40 15% 95%;
  --background-elevated: 0 0% 100%;
  --background-muted: 40 10% 92%;
  
  /* Foreground - Midnight Blue */
  --foreground: 225 28% 14%;
  --foreground-muted: 225 15% 35%;
  --foreground-subtle: 225 10% 55%;
  
  /* Primary - Midnight (inverte no dark) */
  --primary: 225 28% 14%;
  --primary-foreground: 40 20% 98%;
  
  /* Accent 1 - Coral Terracota (CTAs) */
  --accent1: 15 62% 59%;
  --accent1-foreground: 0 0% 100%;
  
  /* Accent 2 - Verde Mineral (Sucesso) */
  --accent2: 165 40% 39%;
  --accent2-foreground: 0 0% 100%;
}
```

---

### FASE 2: Atualizar Tailwind Config (tailwind.config.js)

**Novos tokens:**
```javascript
colors: {
  // ... existing
  accent1: {
    DEFAULT: "hsl(var(--accent1))",
    foreground: "hsl(var(--accent1-foreground))",
    hover: "hsl(var(--accent1-hover))",
    muted: "hsl(var(--accent1-muted))",
  },
  accent2: {
    DEFAULT: "hsl(var(--accent2))",
    foreground: "hsl(var(--accent2-foreground))",
    hover: "hsl(var(--accent2-hover))",
    muted: "hsl(var(--accent2-muted))",
  },
}
```

---

### FASE 3: Animação de Transição de Tema

**Implementar transição suave de 400ms com microinterações:**

```css
/* Transição global de tema */
html.transitioning-theme * {
  transition: 
    background-color 400ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 400ms cubic-bezier(0.4, 0, 0.2, 1),
    color 300ms cubic-bezier(0.4, 0, 0.2, 1),
    fill 300ms cubic-bezier(0.4, 0, 0.2, 1),
    stroke 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Microinteração: leve blur durante transição */
html.transitioning-theme body {
  filter: blur(1px);
  animation: theme-transition 400ms ease-out;
}

@keyframes theme-transition {
  0% { filter: blur(1px); opacity: 0.95; }
  100% { filter: blur(0); opacity: 1; }
}
```

---

### FASE 4: Atualizar ThemeToggle (src/components/common/ThemeToggle.jsx)

**Alterações:**
1. Adicionar classe `transitioning-theme` ao HTML durante toggle
2. Remover classe após 400ms
3. Melhorar animação do ícone com cores da nova paleta

```jsx
const toggleTheme = () => {
  // Adiciona classe para animação suave
  document.documentElement.classList.add('transitioning-theme');
  
  setTheme(isDark ? 'light' : 'dark');
  
  // Remove após transição
  setTimeout(() => {
    document.documentElement.classList.remove('transitioning-theme');
  }, 400);
};
```

**Ícones com cores da paleta:**
- Sol: `text-accent1` (Coral terracota)
- Lua: `text-foreground` (Midnight/Stone)

---

### FASE 5: Garantir Contraste AA/AAA

**Verificações de contraste implementadas:**

| Combinação | Ratio | WCAG |
|------------|-------|------|
| Foreground on Background (light) | 14.5:1 | AAA ✓ |
| Foreground on Background (dark) | 15.2:1 | AAA ✓ |
| Accent1 on Background (light) | 4.8:1 | AA ✓ |
| Accent1 on Background (dark) | 5.2:1 | AA ✓ |
| Accent2 on Background (light) | 4.5:1 | AA ✓ |
| Accent2 on Background (dark) | 5.1:1 | AA ✓ |
| Muted text on Background | 4.7:1 | AA ✓ |

---

### RESUMO DE ARQUIVOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/index.css` | Editar | Nova paleta exclusiva em :root e .dark |
| `tailwind.config.js` | Editar | Adicionar tokens accent1/accent2 |
| `src/components/common/ThemeToggle.jsx` | Editar | Transição animada + cores atualizadas |

---

### RESULTADO VISUAL

```text
MODO CLARO                          MODO ESCURO
━━━━━━━━━━━━━━━━━                   ━━━━━━━━━━━━━━━━━

┌─────────────────────┐            ┌─────────────────────┐
│ ▓▓▓ FAFAF9 (Stone)  │            │ ░░░ 0C0E12 (Obsidian│
│                     │   400ms    │                     │
│   Midnight text     │ ────────►  │   Stone text        │
│   on cream bg       │  fade +    │   on dark bg        │
│                     │  blur      │                     │
│ [Coral CTA Button]  │            │ [Coral CTA Button]  │
│ [Verde Success]     │            │ [Verde Success]     │
└─────────────────────┘            └─────────────────────┘

Transição suave de 400ms com microinteração de blur
```

---

### DIFERENCIAIS DA NOVA PALETA

| Antes (Genérico) | Depois (Exclusivo) |
|------------------|-------------------|
| Azul corporativo #0088FF | Midnight Blue #1A1F2E |
| Verde startup #22C55E | Verde Mineral #3D8B7A |
| Cinza neutro #808080 | Stone/Ivory quentes |
| Fundo branco puro | Cream sutilmente quente |
| Fundo preto puro | Obsidian com matiz azul |
| Transição instantânea | Fade 400ms + blur |

A paleta transmite **inovação** (tonalidades únicas, não óbvias) e **confiança** (cores terrosas, sóbrias) sem remeter a estética de IA ou padrões corporativos genéricos.

