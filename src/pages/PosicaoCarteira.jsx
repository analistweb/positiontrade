import React from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const fetchTopCryptos = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    throw new Error('Falha ao carregar dados da API');
  }
};

const simulateWhaleTransactions = (cryptos) => {
  return cryptos.map(crypto => ({
    id: crypto.id,
    symbol: crypto.symbol,
    amount: Math.floor(Math.random() * 1000000) + 500000,
    from: Math.random() > 0.5 ? 'Exchange' : 'Unknown',
    to: Math.random() > 0.5 ? 'Wallet' : 'Exchange',
    timestamp: Date.now() - Math.floor(Math.random() * 86400000)
  }));
};

const PosicaoCarteira = () => {
  const { data: cryptos, isLoading, error } = useQuery({
    queryKey: ['topCryptos'],
    queryFn: fetchTopCryptos,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  const whaleTransactions = cryptos ? simulateWhaleTransactions(cryptos) : [];

  if (isLoading) return <div className="p-4">Carregando...</div>;

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Falha ao carregar os dados: {error.message}
            <br />
            Por favor, verifique sua conexão com a internet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Posição da Carteira</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Movimentações de Grandes Carteiras (Simuladas)</CardTitle>
        </CardHeader>
        <CardContent>
          {whaleTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criptomoeda</TableHead>
                  <TableHead>Valor (USD)</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whaleTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.symbol.toUpperCase()}</TableCell>
                    <TableCell>${transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>{transaction.from}</TableCell>
                    <TableCell>{transaction.to}</TableCell>
                    <TableCell>{new Date(transaction.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Nenhuma transação encontrada.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Tendências de Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Com base nas movimentações simuladas de grandes carteiras, observamos as seguintes tendências:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>Movimentações significativas em várias criptomoedas de alto valor de mercado.</li>
            <li>Transferências frequentes entre exchanges e carteiras privadas, indicando possível atividade de acumulação ou distribuição.</li>
            <li>Variação nos volumes de transações entre diferentes criptomoedas, sugerindo mudanças no interesse dos grandes investidores.</li>
          </ul>
          <p className="mt-4">
            Lembre-se de que estes dados são simulados para fins de demonstração. Em um cenário real, seria crucial analisar dados verificados de transações de grandes carteiras para obter insights mais precisos sobre as tendências do mercado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PosicaoCarteira;