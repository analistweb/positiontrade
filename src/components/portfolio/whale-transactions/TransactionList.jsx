
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVirtualizer } from '@tanstack/react-virtual';
import TransactionRow from './TransactionRow';
import TransactionSkeleton from './TransactionSkeleton';
import { toast } from "sonner";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const TransactionList = ({ transactions, isLoading, error, dataSource = 'exchange', onRefresh }) => {
  const parentRef = React.useRef(null);
  
  // Configuração do virtualizador
  const rowVirtualizer = useVirtualizer({
    count: transactions?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // altura estimada de cada linha
    overscan: 5, // número de itens para pré-renderizar
  });

  // Mostrar toast de erro se houver algum problema
  React.useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar transações", {
        description: "Verifique sua conexão e tente novamente."
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Horário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalhes</TableHead>
              {dataSource === 'onchain' ? (
                <>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                </>
              ) : (
                <TableHead>Destino</TableHead>
              )}
              <TableHead>Smart Money Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TransactionSkeleton />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao obter dados reais de transações</AlertTitle>
          <AlertDescription>
            <p>Não foi possível conectar às APIs de criptomoedas. Erro: {error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Horário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalhes</TableHead>
              {dataSource === 'onchain' ? (
                <>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                </>
              ) : (
                <TableHead>Destino</TableHead>
              )}
              <TableHead>Smart Money Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={dataSource === 'onchain' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Horário</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Detalhes</TableHead>
            {dataSource === 'onchain' ? (
              <>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
              </>
            ) : (
              <TableHead>Destino</TableHead>
            )}
            <TableHead>Smart Money Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={parentRef} className="relative min-h-[400px]" style={{ height: `${Math.max(rowVirtualizer.getTotalSize(), 400)}px` }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <TransactionRow
              key={virtualRow.key}
              transaction={transactions[virtualRow.index]}
              index={virtualRow.index}
              dataSource={dataSource}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
