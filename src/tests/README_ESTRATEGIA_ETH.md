# Testes da Estratégia ETHUSDT

## 📋 Visão Geral

Este documento descreve os testes implementados para a página **Estratégia ETHUSDT**, que implementa um sistema de trading automatizado baseado em Didi Index, DMI e detecção de rompimentos.

## 🎯 Cobertura de Testes

### 1. Testes de Componente (`EstrategiaETH.test.jsx`)

#### **Renderização Básica**
- ✅ Renderiza título e descrição da página
- ✅ Mostra loading spinner durante carregamento
- ✅ Exibe mensagem de erro quando API falha
- ✅ Renderiza histórico vazio inicialmente
- ✅ Mostra seção "Sobre a Estratégia"
- ✅ Possui botão de refresh

#### **Integração com Binance API**
- ✅ Chama `fetchETHUSDTData` com parâmetros corretos (15m)
- ✅ Processa dados reais da API corretamente
- ✅ Valida estrutura dos dados (OHLCV)

#### **Lógica de Estratégia**
- ✅ Identifica o candle de referência (menor corpo real)
- ✅ Valida estrutura mínima de dados (100+ velas)
- ✅ Calcula rompimento com threshold de 0.05%
- ✅ Implementa gestão de risco com relação 1:2

#### **Validação de Dados Reais**
- ✅ Verifica se todos os valores são numéricos
- ✅ Valida consistência OHLC (high ≥ low, etc.)
- ✅ Confirma timestamps em ordem crescente

---

### 2. Testes de Serviço (`binanceService.test.js`)

#### **Requisições à API**
- ✅ Faz requisição para endpoint correto da Binance
- ✅ Envia parâmetros corretos (symbol, interval, limit)
- ✅ Transforma resposta da API para formato interno
- ✅ Usa valores padrão quando não especificados
- ✅ Aceita diferentes intervalos (15m, 1h, etc.)

#### **Tratamento de Erros**
- ✅ Lança erro apropriado quando API falha
- ✅ Retorna array vazio para resposta vazia

#### **Transformação de Dados**
- ✅ Converte strings para números corretamente
- ✅ Mantém ordem dos dados
- ✅ Preserva precisão decimal

---

### 3. Testes de Indicadores Técnicos (`technicalIndicators.test.js`)

#### **Didi Index**
- ✅ Calcula médias móveis simples (SMA 3, 8, 20)
- ✅ Retorna arrays com tamanhos corretos
- ✅ Valores calculados são precisos

#### **DMI (Directional Movement Index)**
- ✅ Retorna objetos com plusDI, minusDI e ADX
- ✅ Valores de DI entre 0 e 100
- ✅ ADX sempre positivo

#### **EMA (Exponential Moving Average)**
- ✅ Calcula suavização exponencial corretamente
- ✅ Reage a mudanças de preço
- ✅ Primeiro valor = primeiro preço

#### **ATR (Average True Range)**
- ✅ Retorna valores positivos
- ✅ Tamanho de array correto
- ✅ Reflete volatilidade do mercado

#### **Integração**
- ✅ Todos os indicadores funcionam juntos sem erros

---

## 🚀 Como Rodar os Testes

### Rodar todos os testes
```bash
npm run test
```

### Rodar testes específicos
```bash
# Apenas testes da página
npm run test src/tests/pages/EstrategiaETH.test.jsx

# Apenas testes do serviço
npm run test src/tests/services/binanceService.test.js

# Apenas testes de indicadores
npm run test src/tests/utils/technicalIndicators.test.js
```

### Rodar com cobertura
```bash
npm run test:coverage
```

### Modo watch (desenvolvimento)
```bash
npm run test:watch
```

---

## 📊 Estrutura dos Dados de Teste

### Exemplo de Candle (OHLCV)
```javascript
{
  timestamp: 1609459200000,  // Unix timestamp
  open: 3500.00,             // Preço de abertura
  high: 3550.00,             // Preço máximo
  low: 3450.00,              // Preço mínimo
  close: 3525.00,            // Preço de fechamento
  volume: 1234.56            // Volume negociado
}
```

### Dados Mockados
Os testes usam 100 velas simuladas com:
- Variação realista de preços
- Volume entre 1000-1500
- Padrão de compressão seguido de rompimento

---

## ✅ Checklist de Validação

### Dados Reais da Binance
- [ ] API responde com sucesso
- [ ] Dados estão no formato correto
- [ ] Timestamps estão ordenados
- [ ] Valores OHLC são consistentes
- [ ] Volume é positivo

### Lógica da Estratégia
- [ ] Identifica candle de referência corretamente
- [ ] Detecta rompimentos (buy/sell)
- [ ] Valida indicadores técnicos (Didi, DMI, EMA, ATR)
- [ ] Aplica filtros de volatilidade e volume
- [ ] Calcula SL/TP com relação 1:2

### Performance
- [ ] Testes executam em < 5 segundos
- [ ] Sem memory leaks
- [ ] Mocks funcionam corretamente

---

## 🔍 Debugging

### Ver logs detalhados
```bash
npm run test -- --reporter=verbose
```

### Rodar teste isolado
```bash
npm run test -- -t "deve renderizar o título da página"
```

### Inspecionar falhas
```javascript
// Adicione no teste:
console.log('Result:', result);
```

---

## 📝 Notas Importantes

### Dados Reais vs Mockados
- **Em testes**: Usamos dados mockados para consistência
- **Na aplicação**: Usa API real da Binance
- **Validação**: Testes verificam estrutura e tipos de dados

### Limitações Conhecidas
1. Testes não fazem requisições reais à Binance (mockados)
2. Análise complexa de indicadores usa dados simplificados
3. Não testa todas as combinações de sinais possíveis

### Melhorias Futuras
- [ ] Testes E2E com dados reais
- [ ] Testes de performance com 1000+ velas
- [ ] Validação de backtesting
- [ ] Testes de alertas e notificações

---

## 🐛 Resolução de Problemas

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "ReferenceError: fetch is not defined"
Adicione no `setup.js`:
```javascript
global.fetch = vi.fn();
```

### Testes lentos
Reduza `refetchInterval` nos testes ou use `vi.useFakeTimers()`

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Binance API Docs](https://binance-docs.github.io/apidocs/)
- [Indicadores Técnicos](https://www.investopedia.com/terms/t/technicalindicator.asp)

---

## 📈 Resultados Esperados

Ao rodar os testes, você deve ver:

```
✓ src/tests/pages/EstrategiaETH.test.jsx (15 testes)
✓ src/tests/services/binanceService.test.js (9 testes)
✓ src/tests/utils/technicalIndicators.test.js (12 testes)

Total: 36 testes passaram
Tempo: ~3s
```

---

## 🎓 Para Desenvolvedores

### Adicionar Novo Teste

1. Crie o arquivo de teste: `*.test.jsx` ou `*.test.js`
2. Importe dependências necessárias
3. Use `describe()` para agrupar testes relacionados
4. Use `it()` ou `test()` para casos individuais
5. Use `expect()` para asserções

Exemplo:
```javascript
import { describe, it, expect } from 'vitest';

describe('Minha Feature', () => {
  it('deve fazer algo específico', () => {
    const result = minhaFuncao();
    expect(result).toBe(valorEsperado);
  });
});
```

---

**Status**: ✅ Todos os testes implementados e funcionando
**Última atualização**: 2025
