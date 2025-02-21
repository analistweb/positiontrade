
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVirtualizer } from '@tanstack/react-virtual';
import TransactionRow from './TransactionRow';
import TransactionSkeleton from './TransactionSkeleton';
import { toast } from "sonner";

const TransactionList = ({ transactions, isLoading, error }) => {
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
        description: "Tente novamente mais tarde"
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
              <TableHead>Destino</TableHead>
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

  if (!transactions?.length) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Horário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Smart Money Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
            <TableHead>Destino</TableHead>
            <TableHead>Smart Money Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={parentRef} className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <TransactionRow
              key={virtualRow.key}
              transaction={transactions[virtualRow.index]}
              index={virtualRow.index}
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
