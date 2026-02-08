

## Reformulação da Página `/analise-posicao` — Estilo Google-Like

### Visão Geral

Transformar a página de análise de posição em uma interface minimalista e profissional inspirada no Google Search, com uma barra de pesquisa central como elemento principal e indicadores de status dos mercados globais.

---

### Arquitetura Visual

```text
LAYOUT INICIAL (sem resultados):
┌──────────────────────────────────────────────────────────────────┐
│  [Header/Navbar existente]                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│               ┌───────────────────────────┐                      │
│               │  ● EUR  ● USA  ● ASIA     │  ← Status mercados   │
│               └───────────────────────────┘                      │
│                                                                  │
│                   POSITION TRADE                                 │
│                   Analyzer                                       │
│                                                                  │
│        ┌─────────────────────────────────────────────┐          │
│        │  🔍 Digite um ticker...                      │          │
│        └─────────────────────────────────────────────┘          │
│                                                                  │
│            PETR4.SA   VALE3.SA   AAPL   BTC-USD                 │
│                       (badges populares)                         │
│                                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

LAYOUT COM RESULTADOS:
┌──────────────────────────────────────────────────────────────────┐
│  [Header/Navbar existente]                                       │
├──────────────────────────────────────────────────────────────────┤
│        ┌─────────────────────────────────────────────┐          │
│        │  🔍 PETR4.SA                                │ Analisar │
│        └─────────────────────────────────────────────┘          │
│        ● EUR ● USA ● ASIA                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │   TrendCard         │  │   IndicatorsCard    │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  ┌────────────────────────────────────────────────┐             │
│  │              PositionChart                      │             │
│  └────────────────────────────────────────────────┘             │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │ LevelsTable│  │ RiskScore  │  │ EntryPoints│                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
│                                                                  │
│  ┌────────────────────────────────────────────────┐             │
│  │         ExecutiveSummary                        │             │
│  └────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

---

### Componentes a Criar

#### 1. MarketStatusWidget (novo componente)
Indicadores de status dos mercados globais baseados no horário de Brasília.

```text
LÓGICA DE HORÁRIOS (Brasília):
├── Europeu: 04h-08h → Verde se dentro, Cinza fora
├── Americano: 10h-17h → Verde se dentro, Cinza fora
└── Asiático: 21h-00h → Verde se dentro, Cinza fora

VISUAL:
┌───────────────────────────────────┐
│  ● EUR    ● USA    ● ASIA        │
│  Aberto   Fechado  Fechado       │
└───────────────────────────────────┘
```

#### 2. GoogleStyleSearchBar (novo componente interno)
Barra de pesquisa centralizada estilo Google.

**Especificações:**
- Largura máxima: `max-w-2xl` (672px)
- Borda arredondada: `rounded-full`
- Ícone de busca interno à esquerda
- Sombra sutil: `shadow-sm` → `hover:shadow-lg`
- Transição suave: `transition-shadow duration-200`
- Altura: `h-14` para toque confortável
- Botão de submit integrado (modo com resultados) ou oculto (modo inicial)

---

### Alterações no Arquivo Principal

**Arquivo:** `src/pages/AnalisePosicao.tsx`

#### Mudanças estruturais:

1. **Estado bifurcado:**
   - `hasResults = false`: Layout centralizado vertical (Google homepage)
   - `hasResults = true`: Layout com barra fixa no topo + resultados

2. **Container principal:**
   ```tsx
   // Sem resultados
   <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
   
   // Com resultados
   <div className="container mx-auto px-4 py-6 max-w-7xl">
   ```

3. **Preservação total da lógica de backend:**
   - Hook `usePositionAnalysis` mantido intacto
   - Props `onSearch`, `isLoading`, `currentTicker` preservadas
   - Todos os componentes de resultado (TrendCard, etc.) sem alterações

---

### Detalhes Técnicos

#### MarketStatusWidget — Lógica de Horário

```typescript
function getMarketStatus() {
  const now = new Date();
  // Brasília = UTC-3
  const brasiliaOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const brasiliaTime = new Date(now.getTime() + (localOffset + brasiliaOffset) * 60000);
  const hour = brasiliaTime.getHours();
  
  return {
    european: hour >= 4 && hour < 8,   // 04h-08h
    american: hour >= 10 && hour < 17, // 10h-17h
    asian: hour >= 21 || hour < 0,     // 21h-00h (atravessa meia-noite)
  };
}
```

#### Estilização da SearchBar

```tsx
<div className="relative w-full max-w-2xl">
  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
  <input
    type="text"
    placeholder="Digite um ticker (ex: PETR4.SA, AAPL, BTC-USD)"
    className="w-full h-14 pl-14 pr-6 rounded-full border border-border/50 
               bg-background shadow-sm hover:shadow-lg focus:shadow-lg 
               focus:outline-none focus:ring-2 focus:ring-primary/20
               transition-shadow duration-200 text-lg"
  />
</div>
```

---

### Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| Mobile (<640px) | SearchBar `max-w-full px-4`, badges empilham |
| Tablet (640-1024px) | SearchBar `max-w-xl`, grid 2 colunas |
| Desktop (>1024px) | SearchBar `max-w-2xl`, grid 3 colunas |

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/AnalisePosicao.tsx` | Reformular layout completo |
| `src/components/position/AssetSearchInput.tsx` | Adaptar para estilo Google |
| `src/components/position/index.ts` | Exportar novo componente |

---

### Preservação de Funcionalidade

A seguinte lógica será mantida **intacta**:

- `usePositionAnalysis` hook (fetch, analyze, ticker, data, error)
- Props interface de `AssetSearchInput`
- Todos os componentes de resultado (TrendCard, IndicatorsCard, etc.)
- Animações com framer-motion
- Tratamento de estados (loading, error, empty)

---

### Resultado Visual Esperado

**Estado inicial (sem pesquisa):**
- Tela limpa e focada
- Widget de mercados discreto no topo
- Logo/título centralizado
- Barra de pesquisa proeminente
- Badges de tickers populares abaixo

**Estado com resultados:**
- Barra de pesquisa move para o topo
- Widget de mercados ao lado da barra
- Resultados fluem abaixo no grid existente
- Transição suave entre estados

