# Análise de Mercado - Documentação Técnica

## Arquitetura

O módulo de análise de mercado segue uma arquitetura em camadas:

1. **Componentes de UI** (`/components`)
   - Componentes React isolados e reutilizáveis
   - Seguem o princípio de responsabilidade única
   - Implementam padrões de apresentação

2. **Hooks** (`/hooks`)
   - Lógica de negócios reutilizável
   - Gerenciamento de estado e ciclo de vida
   - Integração com APIs

3. **Utilitários** (`/utils`)
   - Funções puras para cálculos e transformações
   - Helpers reutilizáveis
   - Sem estado ou efeitos colaterais

## Padrões de Projeto

1. **Custom Hooks Pattern**
   - Encapsulamento de lógica complexa
   - Reutilização de funcionalidade
   - Separação de concerns

2. **Container/Presentational Pattern**
   - Componentes de apresentação focados em UI
   - Containers gerenciam estado e lógica

3. **Strategy Pattern**
   - Implementado nos cálculos de indicadores técnicos
   - Permite extensão fácil para novos indicadores

## Fluxo de Dados

1. Fetch de dados via React Query
2. Processamento em utilitários puros
3. Renderização em componentes UI
4. Atualizações automáticas a cada 5 minutos

## Testes

Para executar os testes:
```bash
npm run test
```

Cobertura atual: ~85%

## Manutenção

1. Adicionar novos indicadores:
   - Criar função em `technicalAnalysis.js`
   - Criar componente de visualização
   - Atualizar documentação

2. Modificar período de atualização:
   - Ajustar `refetchInterval` em `useMarketData.js`