

## Plano: Sistema de Vigilância de Manipulação de Mercado Cripto

### VISÃO GERAL

Implementar um dashboard mobile-first completamente isolado para detecção de manipulação de mercado cripto, utilizando WebSocket Streams gratuitos da Binance e um sistema de métricas proprietário.

---

### ARQUITETURA DE ISOLAMENTO

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA EXISTENTE (Não Modificado)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  PriceChart     │  │ CryptoBubbles   │  │ binanceSocket   │         │
│  │  (read-only)    │  │  (read-only)    │  │   (singleton)   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Dados compartilhados (somente leitura)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               NOVO: MARKET SURVEILLANCE SYSTEM (Isolado)                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              MarketSurveillanceProvider (Contexto)                   ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  ││
│  │  │ WebSocket   │  │  Métricas   │  │  Status     │                  ││
│  │  │ Manager     │  │  Calculator │  │  Engine     │                  ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                        Componentes UI                                ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 ││
│  │  │MarketStatus  │ │WhatIsHappen  │ │ImmediateRisk │                 ││
│  │  │Card          │ │ingCard       │ │Card          │                 ││
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 ││
│  │  ┌──────────────┐ ┌──────────────┐                                  ││
│  │  │Correlation   │ │MarketControl │                                  ││
│  │  │SimpleCard    │ │Bar           │                                  ││
│  │  └──────────────┘ └──────────────┘                                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

### FASE 1: Serviço WebSocket Isolado

**Arquivo:** `src/services/surveillance/binanceMultiStream.ts`

**Funcionalidades:**
- Gerenciador de múltiplos WebSocket streams da Binance
- Máximo de 5 streams por conexão (limite Binance)
- Limpeza automática de listeners ao desmontar
- Validação de dados com Zod antes de processar

**Streams a conectar:**
```typescript
// Trade Stream - para detectar wash trading
wss://stream.binance.com:9443/ws/btcusdt@trade

// Order Book Stream - para detectar spoofing
wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms

// Kline Stream - para análise de volume
wss://stream.binance.com:9443/ws/btcusdt@kline_1m

// Ticker Stream - para preço e variação 24h
wss://stream.binance.com:9443/ws/btcusdt@ticker
```

**Validação de dados:**
```typescript
// Schemas Zod para cada tipo de mensagem
const tradeSchema = z.object({
  e: z.literal('trade'),
  p: z.string(), // price
  q: z.string(), // quantity
  T: z.number(), // timestamp
  m: z.boolean() // buyer is market maker
});

const depthSchema = z.object({
  bids: z.array(z.tuple([z.string(), z.string()])),
  asks: z.array(z.tuple([z.string(), z.string()]))
});
```

---

### FASE 2: Calculadores de Métricas

**Arquivo:** `src/services/surveillance/metricsCalculator.ts`

**Métricas implementadas:**

| Métrica | Fórmula | Descrição |
|---------|---------|-----------|
| `volumeMetrics.zScore` | (V - μ) / σ | Desvio padrão do volume |
| `orderBookMetrics.imbalanceRatio` | (Bids - Asks) / Total | Assimetria do livro |
| `washTradingMetrics.repeatPatternScore` | Trades repetidos / Total | Padrão de wash trading |
| `spoofingMetrics.phantomOrderScore` | Ordens canceladas / Total | Ordens fantasma |
| `correlationMetrics.correlation` | Pearson(price, volume) | Correlação preço-volume |

**Lógica de cálculo (isolada):**
```typescript
export function calculateMetrics(
  trades: Trade[],
  orderBook: OrderBook,
  klines: Kline[]
): SurveillanceMetrics {
  // Validar inputs
  if (!trades.length || !orderBook.bids.length) {
    return getDefaultMetrics();
  }
  
  // Calcular cada métrica independentemente
  return {
    volumeMetrics: calculateVolumeZScore(klines),
    orderBookMetrics: calculateImbalanceRatio(orderBook),
    washTradingMetrics: calculateWashTradingScore(trades),
    spoofingMetrics: calculatePhantomOrderScore(orderBook),
    correlationMetrics: calculatePriceVolumeCorrelation(klines),
    price: parseFloat(trades[trades.length - 1].p),
    priceChange24h: calculatePriceChange(klines)
  };
}
```

---

### FASE 3: Engine de Status de Mercado

**Arquivo:** `src/services/surveillance/marketStatusEngine.ts`

**Função `calculateMarketStatus` (isolada):**

```typescript
export type MarketStatus = 
  | 'HEALTHY'      // 🟢 Mercado Saudável
  | 'ARTIFICIAL'   // 🟡 Mercado Artificial
  | 'MANIPULATED'; // 🔴 Mercado Manipulado

export function calculateMarketStatus(metrics: SurveillanceMetrics): MarketStatus {
  // Não altera métricas globais - função pura
  const {
    volumeMetrics,
    orderBookMetrics,
    washTradingMetrics,
    spoofingMetrics
  } = metrics;
  
  // Score de manipulação (0-100)
  const manipulationScore = 
    (volumeMetrics.zScore > 3 ? 25 : 0) +
    (Math.abs(orderBookMetrics.imbalanceRatio) > 0.7 ? 25 : 0) +
    (washTradingMetrics.repeatPatternScore > 0.4 ? 25 : 0) +
    (spoofingMetrics.phantomOrderScore > 0.3 ? 25 : 0);
  
  if (manipulationScore >= 50) return 'MANIPULATED';
  if (manipulationScore >= 25) return 'ARTIFICIAL';
  return 'HEALTHY';
}
```

---

### FASE 4: Context Provider Isolado

**Arquivo:** `src/contexts/MarketSurveillanceContext.tsx`

**Estrutura:**
```typescript
interface SurveillanceState {
  metrics: SurveillanceMetrics | null;
  status: MarketStatus;
  isConnected: boolean;
  lastUpdate: Date | null;
  selectedPair: string;
  error: string | null;
}

export const MarketSurveillanceProvider: React.FC = ({ children }) => {
  // Estado completamente isolado
  const [state, dispatch] = useReducer(surveillanceReducer, initialState);
  
  // WebSocket manager com cleanup
  useEffect(() => {
    const manager = new BinanceMultiStream();
    manager.connect(state.selectedPair);
    
    manager.onMetrics((metrics) => {
      dispatch({ type: 'UPDATE_METRICS', payload: metrics });
    });
    
    // Cleanup ao desmontar
    return () => {
      manager.disconnect();
      manager.removeAllListeners();
    };
  }, [state.selectedPair]);
  
  return (
    <MarketSurveillanceContext.Provider value={{ state, dispatch }}>
      {children}
    </MarketSurveillanceContext.Provider>
  );
};
```

---

### FASE 5: Componentes Mobile-First

**Estrutura de arquivos:**
```text
src/components/surveillance/
├── MarketStatusCard.tsx      # Status principal (🟢🟡🔴)
├── MarketControlBar.tsx      # Seletor de par + conexão
├── WhatIsHappeningCard.tsx   # Explicação do status
├── ImmediateRiskCard.tsx     # Alertas de risco
├── CorrelationSimpleCard.tsx # Correlação preço-volume
└── index.ts                  # Barrel export
```

**Design Mobile-First:**
```text
MOBILE (Stack Vertical)                DESKTOP (Grid 2 colunas)
┌─────────────────────┐               ┌────────────┬────────────┐
│   MarketControlBar  │               │MarketStatus│  WhatIs    │
├─────────────────────┤               │   Card     │ Happening  │
│   MarketStatusCard  │               ├────────────┼────────────┤
│   (Status Grande)   │               │ Immediate  │Correlation │
├─────────────────────┤               │   Risk     │  Simple    │
│  WhatIsHappeningCard│               └────────────┴────────────┘
├─────────────────────┤
│  ImmediateRiskCard  │
├─────────────────────┤
│ CorrelationSimple   │
└─────────────────────┘
```

**Exemplo - MarketStatusCard:**
```tsx
export const MarketStatusCard: React.FC = React.memo(() => {
  const { state } = useMarketSurveillance();
  
  const statusConfig = useMemo(() => ({
    HEALTHY: {
      gradient: 'var(--status-healthy-gradient)',
      icon: '🟢',
      label: 'Mercado Saudável',
      description: 'Atividade normal detectada'
    },
    ARTIFICIAL: {
      gradient: 'var(--status-artificial-gradient)',
      icon: '🟡',
      label: 'Mercado Artificial',
      description: 'Padrões incomuns detectados'
    },
    MANIPULATED: {
      gradient: 'var(--status-manipulated-gradient)',
      icon: '🔴',
      label: 'Mercado Manipulado',
      description: 'Manipulação ativa detectada'
    }
  }), []);
  
  const config = statusConfig[state.status];
  
  return (
    <div 
      className="surveillance-status-card"
      style={{ background: config.gradient }}
    >
      <span className="status-icon animate-pulse-status">{config.icon}</span>
      <h2 className="status-label">{config.label}</h2>
      <p className="status-description">{config.description}</p>
    </div>
  );
});
```

---

### FASE 6: CSS Variables Isoladas

**Adicionar ao `src/index.css` (sem sobrescrever existentes):**

```css
/* ========================================
   🔍 MARKET SURVEILLANCE - Isolated Styles
   ======================================== */

/* Status Gradients - Surveillance Only */
:root {
  --status-healthy-gradient: linear-gradient(
    135deg, 
    hsl(165 45% 35% / 0.15) 0%, 
    hsl(165 45% 25% / 0.25) 100%
  );
  --status-artificial-gradient: linear-gradient(
    135deg, 
    hsl(45 85% 45% / 0.15) 0%, 
    hsl(45 85% 35% / 0.25) 100%
  );
  --status-manipulated-gradient: linear-gradient(
    135deg, 
    hsl(0 75% 45% / 0.15) 0%, 
    hsl(0 75% 35% / 0.25) 100%
  );
}

.dark {
  --status-healthy-gradient: linear-gradient(
    135deg, 
    hsl(165 45% 25% / 0.2) 0%, 
    hsl(165 45% 15% / 0.35) 100%
  );
  --status-artificial-gradient: linear-gradient(
    135deg, 
    hsl(45 85% 35% / 0.2) 0%, 
    hsl(45 85% 25% / 0.35) 100%
  );
  --status-manipulated-gradient: linear-gradient(
    135deg, 
    hsl(0 75% 35% / 0.2) 0%, 
    hsl(0 75% 25% / 0.35) 100%
  );
}

/* Surveillance-specific animations (CSS-only) */
.animate-pulse-status {
  animation: pulse-status 2s ease-in-out infinite;
}

@keyframes pulse-status {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

/* Surveillance cards */
.surveillance-card {
  @apply rounded-xl border border-border/50 p-4 transition-all duration-300;
  @apply bg-card/80 backdrop-blur-sm;
}

.surveillance-status-card {
  @apply surveillance-card text-center py-8;
}

.status-icon {
  @apply text-5xl mb-4 inline-block;
}

.status-label {
  @apply text-xl font-bold text-foreground mb-2;
}

.status-description {
  @apply text-sm text-foreground-muted;
}
```

---

### FASE 7: Página do Dashboard

**Arquivo:** `src/pages/MarketSurveillance.tsx`

```tsx
const MarketSurveillance: React.FC = () => {
  return (
    <MarketSurveillanceProvider>
      <div className="min-h-screen bg-background p-4">
        {/* Control Bar */}
        <MarketControlBar />
        
        {/* Cards Grid - Mobile-first */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <MarketStatusCard />
          <WhatIsHappeningCard />
          <ImmediateRiskCard />
          <CorrelationSimpleCard />
        </div>
      </div>
    </MarketSurveillanceProvider>
  );
};
```

---

### FASE 8: Testes Smoke

**Arquivo:** `src/tests/surveillance/surveillance.test.ts`

```typescript
describe('Market Surveillance System', () => {
  // Teste 1: WebSocket isolado
  it('should connect to Binance streams independently', async () => {
    const manager = new BinanceMultiStream();
    await manager.connect('BTCUSDT');
    expect(manager.isConnected()).toBe(true);
    manager.disconnect();
  });
  
  // Teste 2: calculateMarketStatus retorna status correto
  it('should return HEALTHY for normal metrics', () => {
    const normalMetrics = getMockNormalMetrics();
    const status = calculateMarketStatus(normalMetrics);
    expect(status).toBe('HEALTHY');
  });
  
  it('should return MANIPULATED for suspicious metrics', () => {
    const suspiciousMetrics = getMockSuspiciousMetrics();
    const status = calculateMarketStatus(suspiciousMetrics);
    expect(status).toBe('MANIPULATED');
  });
  
  // Teste 3: Renderização sem quebrar layout
  it('should render cards without breaking existing layout', () => {
    render(
      <MarketSurveillanceProvider>
        <MarketStatusCard />
      </MarketSurveillanceProvider>
    );
    expect(screen.getByText(/Mercado/)).toBeInTheDocument();
  });
  
  // Teste 4: App existente continua funcionando
  it('should not affect existing components', () => {
    render(<PriceChart data={[]} isLoading={false} error={null} />);
    expect(screen.getByText('Gráfico de Preços')).toBeInTheDocument();
  });
});
```

---

### ESTRUTURA FINAL DE ARQUIVOS

```text
src/
├── contexts/
│   └── MarketSurveillanceContext.tsx  # Contexto isolado
├── services/
│   └── surveillance/
│       ├── binanceMultiStream.ts      # WebSocket manager
│       ├── metricsCalculator.ts       # Calculadores
│       ├── marketStatusEngine.ts      # Engine de status
│       ├── types.ts                   # Tipos TypeScript
│       └── index.ts                   # Exports
├── components/
│   └── surveillance/
│       ├── MarketStatusCard.tsx       # Status principal
│       ├── MarketControlBar.tsx       # Controles
│       ├── WhatIsHappeningCard.tsx    # Explicações
│       ├── ImmediateRiskCard.tsx      # Alertas
│       ├── CorrelationSimpleCard.tsx  # Correlação
│       └── index.ts                   # Exports
├── pages/
│   └── MarketSurveillance.tsx         # Página principal
└── tests/
    └── surveillance/
        └── surveillance.test.ts       # Smoke tests
```

---

### CHECKLIST TÉCNICO

| Requisito | Implementação |
|-----------|---------------|
| Contexto isolado | `MarketSurveillanceContext` com estado próprio |
| WebSocket com cleanup | `BinanceMultiStream` com `removeAllListeners()` |
| Dados validados | Schemas Zod para cada stream |
| `calculateMarketStatus` puro | Função sem side effects |
| Memoization | `React.memo` + `useMemo` em todos os cards |
| Gradientes isolados | Variáveis CSS com prefixo `--status-` |
| Smoke tests | 4 testes essenciais implementados |
| Mobile-first | Stack vertical → Grid 2 colunas |

---

### NAVEGAÇÃO

Adicionar nova rota ao `nav-items.jsx`:
```jsx
{
  title: "Vigilância de Mercado",
  to: "/market-surveillance",
  icon: <ShieldAlertIcon className="h-4 w-4" />,
  page: <MarketSurveillance />,
  description: "Detecção de manipulação em tempo real com análise de order book e trades"
}
```

