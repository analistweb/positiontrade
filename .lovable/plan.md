

## Plano: Reformulação Visual da Página Painel

### VISÃO GERAL

Redesign completo da página inicial (painel) com foco em impacto visual máximo, reorganizando a hierarquia de conteúdo:

1. **TOPO**: Seção "AO VIVO - Principais Criptomoedas" como destaque principal
2. **SEQUÊNCIA**: Seção de Notícias com banner imersivo e chamativo

---

### NOVA HIERARQUIA DA PÁGINA

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                  🔴 AO VIVO - CHAMADA PRINCIPAL                    │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                                                                     │ │
│  │   Hero imersivo com parallax + efeitos cinematográficos             │ │
│  │   Badge pulsante "AO VIVO"                                          │ │
│  │   Título grande: "Principais Criptomoedas"                          │ │
│  │   Subtítulo: "Dados em tempo real do mercado global"                │ │
│  │                                                                     │ │
│  │   [CRYPTO BUBBLES ANIMADAS - DESTAQUE VISUAL]                       │ │
│  │                                                                     │ │
│  │   Stats rápidos: Market Cap | Dominância BTC | Fear & Greed         │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   📰 NOTÍCIAS - BANNER PREMIUM                      │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │                                                                     │ │
│  │   Banner cinematográfico com gradiente animado                      │ │
│  │   Título: "Últimas Atualizações"                                    │ │
│  │   Badge: "TEMPO REAL" pulsante                                      │ │
│  │   Ícone Newspaper com efeito sparkle                                │ │
│  │                                                                     │ │
│  │   [CARDS DE NOTÍCIAS COM IMAGENS + IMPACTO]                         │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   🛠️ FERRAMENTAS DE ANÁLISE                         │ │
│  │   Cards de navegação rápida                                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### FASE 1: Hero "AO VIVO" - Cripto Bubbles

**Novo componente:** `src/components/dashboard/LiveCryptoHero.jsx`

**Design visual:**
```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Background: Gradiente escuro cinematográfico                           │
│  Pattern: Grid sutil animado                                            │
│                                                                          │
│   ┌─────────────────┐                                                   │
│   │ 🔴 AO VIVO      │  Badge vermelho pulsante                          │
│   └─────────────────┘                                                   │
│                                                                          │
│   PRINCIPAIS CRIPTOMOEDAS                                                │
│   ━━━━━━━━━━━━━━━━━━━━━━━━                                               │
│   Fonte hero grande, branca, tracking tight                             │
│                                                                          │
│   "Dados em tempo real do mercado global de criptomoedas"               │
│   Subtítulo em tom mais claro                                            │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                    CRYPTO BUBBLES                                  │ │
│   │                                                                    │ │
│   │      ┌───┐           ┌─────────┐          ┌────┐                  │ │
│   │     │BTC │          │   ETH   │         │BNB │                   │ │
│   │      └───┘           └─────────┘          └────┘                  │ │
│   │           ┌──┐              ┌────┐                                 │ │
│   │          │XRP│             │SOL │                                 │ │
│   │           └──┘              └────┘                                 │ │
│   │                                                                    │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐│
│   │  Market Cap        │  Dominância BTC    │  Fear & Greed            ││
│   │  $2.45T            │  52.3%             │  65 - Greed              ││
│   └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│   Gradient fade para seção seguinte                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Elementos visuais:**
- Badge "AO VIVO" com animação de pulso vermelho
- Orbs flutuantes com parallax
- Grid pattern animado no background
- Gradiente cinematográfico (slate-900 → slate-800 → slate-900)
- Scroll indicator no bottom

---

### FASE 2: Banner de Notícias Premium

**Novo componente:** `src/components/dashboard/NewsBannerHero.jsx`

**Design visual:**
```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Background: Gradiente azul profundo → coral accent1                    │
│  Pattern: Linhas diagonais sutis                                        │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐│
│   │                                                                      ││
│   │   ┌─────────────────┐     ┌───────────────────────────────────────┐││
│   │   │  📰              │    │  ⚡ TEMPO REAL                         │││
│   │   │  Ícone grande    │    │     Badge verde pulsante              │││
│   │   │  com glow        │    └───────────────────────────────────────┘││
│   │   └─────────────────┘                                               ││
│   │                                                                      ││
│   │   ÚLTIMAS ATUALIZAÇÕES                                              ││
│   │   ━━━━━━━━━━━━━━━━━━━━━━━━                                          ││
│   │                                                                      ││
│   │   "Notícias que movem o mercado cripto"                             ││
│   │                                                                      ││
│   │   ┌───────────────────────────────────────────────────────────────┐ ││
│   │   │  Filtros: [Todas] [Regulação] [Economia] [Mercado]            │ ││
│   │   └───────────────────────────────────────────────────────────────┘ ││
│   │                                                                      ││
│   └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Elementos visuais:**
- Ícone Newspaper com efeito sparkle animado
- Badge "TEMPO REAL" com pulsação verde
- Gradiente animado de fundo (accent1/coral → accent2/teal)
- Orbs flutuantes com blur
- Tipografia hero grande e impactante

---

### FASE 3: Atualizar Index.jsx

**Reorganização da estrutura:**

```jsx
// ANTES
1. EditorialHero (genérico)
2. Market Stats (5 cards)
3. Crypto Bubbles
4. News Section
5. Quick Links

// DEPOIS
1. LiveCryptoHero (AO VIVO + Bubbles + Stats integrados)
2. NewsBannerHero (banner chamativo)
3. MarketNewsSection (cards de notícias)
4. Quick Links (ferramentas)
```

---

### FASE 4: Melhorias Visuais Adicionais

**1. Stats Cards integrados ao Hero:**
- Inline com o hero principal
- Background glass morphism
- Animação de entrada staggered

**2. Crypto Bubbles aprimoradas:**
- Aumentar área de display
- Intensificar efeito de glow
- Adicionar contador de atualização

**3. Transições entre seções:**
- Gradient fades suaves
- Scroll-triggered animations
- Parallax em múltiplas camadas

---

### RESUMO DE ARQUIVOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/dashboard/LiveCryptoHero.jsx` | Criar | Hero "AO VIVO" com bubbles e stats |
| `src/components/dashboard/NewsBannerHero.jsx` | Criar | Banner premium para notícias |
| `src/pages/Index.jsx` | Editar | Nova estrutura reorganizada |
| `src/components/dashboard/CryptoBubbles.jsx` | Editar | Melhorias visuais + espaçamento |

---

### RESULTADO ESPERADO

**Impacto visual:**
- Primeira impressão forte com "AO VIVO" pulsante
- Bubbles como destaque central imediato
- Banner de notícias como segunda chamada impactante
- Hierarquia clara: Dados → Notícias → Ferramentas

**Experiência do usuário:**
- Informação mais importante primeiro (preços ao vivo)
- Notícias com destaque visual premium
- Navegação fluida entre seções
- Animações que guiam o olhar

