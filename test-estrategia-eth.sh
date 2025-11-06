#!/bin/bash

echo "🧪 TESTANDO ESTRATÉGIA ETHUSDT"
echo "================================"
echo ""

echo "📊 Rodando testes da página..."
npm run test src/tests/pages/EstrategiaETH.test.jsx

echo ""
echo "🔌 Rodando testes do serviço Binance..."
npm run test src/tests/services/binanceService.test.js

echo ""
echo "📈 Rodando testes dos indicadores técnicos..."
npm run test src/tests/utils/technicalIndicators.test.js

echo ""
echo "================================"
echo "✅ Testes concluídos!"
echo ""
echo "Para ver relatório de cobertura:"
echo "npm run test:coverage"
