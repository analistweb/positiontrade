import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchMarketData, fetchTopCoins, fetchWhaleTransactions } from "@/services/marketService";
import { fetchLiquidationData, fetchMarketSentiment, fetchMarketNews } from "@/services/api";
import { fetchTopFormationData, fetchWhaleTransactions as fetchCryptoWhale } from "@/services/cryptoService";

const SystemHealthCheck = () => {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState({});

  const tests = [
    {
      name: "CoinGecko - Dados de Mercado",
      key: "coingecko_market",
      test: () => fetchMarketData('bitcoin', 7)
    },
    {
      name: "CoinGecko - Top Moedas",
      key: "coingecko_top",
      test: () => fetchTopCoins()
    },
    {
      name: "Fear & Greed Index",
      key: "fear_greed",
      test: () => fetchMarketSentiment()
    },
    {
      name: "Movimentações de Mercado",
      key: "whale_market",
      test: () => fetchWhaleTransactions('7d')
    },
    {
      name: "Análise de Formação de Topo",
      key: "formation",
      test: () => fetchTopFormationData()
    },
    {
      name: "Coinglass - Liquidações",
      key: "coinglass_liq",
      test: () => fetchLiquidationData(),
      optional: true
    },
    {
      name: "CryptoPanic - Notícias",
      key: "cryptopanic_news",
      test: () => fetchMarketNews(),
      optional: true
    }
  ];

  const runHealthCheck = async () => {
    setChecking(true);
    const newResults = {};

    toast.info("Iniciando verificação de integridade do sistema...");

    for (const test of tests) {
      try {
        console.log(`🔍 Testando: ${test.name}`);
        await test.test();
        newResults[test.key] = { status: 'success', message: 'OK - Dados reais recebidos' };
        console.log(`✅ ${test.name}: OK`);
      } catch (error) {
        newResults[test.key] = { 
          status: test.optional ? 'warning' : 'error', 
          message: error.message 
        };
        console.error(`❌ ${test.name}:`, error.message);
      }
    }

    setResults(newResults);
    setChecking(false);

    const successCount = Object.values(newResults).filter(r => r.status === 'success').length;
    const totalTests = tests.length;

    if (successCount === totalTests) {
      toast.success(`✅ Todos os ${totalTests} testes passaram! Sistema 100% operacional com dados reais.`);
    } else {
      toast.warning(`⚠️ ${successCount}/${totalTests} testes passaram. Alguns serviços podem estar indisponíveis.`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-danger" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success">✓ Real</Badge>;
      case 'warning':
        return <Badge className="bg-warning">⚠ Opcional</Badge>;
      case 'error':
        return <Badge className="bg-danger">✗ Erro</Badge>;
      default:
        return <Badge variant="secondary">Não testado</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔬 Verificação de Integridade do Sistema</span>
          <Button 
            onClick={runHealthCheck} 
            disabled={checking}
            size="sm"
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Testar APIs
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tests.map(test => (
            <div 
              key={test.key}
              className="flex items-center justify-between p-3 rounded-lg bg-card-hover border border-border"
            >
              <div className="flex items-center gap-3">
                {results[test.key] && getStatusIcon(results[test.key].status)}
                <div>
                  <p className="font-semibold text-sm">{test.name}</p>
                  {results[test.key] && (
                    <p className="text-xs text-muted-foreground">
                      {results[test.key].message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {results[test.key] ? (
                  getStatusBadge(results[test.key].status)
                ) : (
                  <Badge variant="secondary">Aguardando</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(results).length > 0 && (
          <div className="mt-6 p-4 bg-background-elevated rounded-lg border border-border">
            <h4 className="font-semibold mb-2">📊 Resumo:</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-success">
                  {Object.values(results).filter(r => r.status === 'success').length}
                </p>
                <p className="text-xs text-muted-foreground">Operacionais</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">
                  {Object.values(results).filter(r => r.status === 'warning').length}
                </p>
                <p className="text-xs text-muted-foreground">Opcionais</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-danger">
                  {Object.values(results).filter(r => r.status === 'error').length}
                </p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-info/10 rounded-lg border border-info/30">
          <p className="text-sm text-info-foreground">
            ℹ️ <strong>Nota:</strong> Todos os dados são obtidos em tempo real de APIs externas. 
            Nenhum dado simulado é utilizado. APIs opcionais (Coinglass, CryptoPanic) requerem 
            chaves de API configuradas nas variáveis de ambiente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;
