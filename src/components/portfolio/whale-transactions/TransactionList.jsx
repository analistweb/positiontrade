
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { formatDate, formatCurrency } from '@/lib/utils';
import TransactionRow from './TransactionRow';
import TransactionSkeleton from './TransactionSkeleton';
import { toast } from "sonner";

const TransactionList = ({ transactions, isLoading, error }) => {
  // Mostrar toast de erro se houver algum problema
  React.useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar transações", {
        description: "Tente novamente mais tarde"
      });
    }
  }, [error]);

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
          {isLoading ? (
            <TransactionSkeleton />
          ) : transactions?.length > 0 ? (
            transactions.map((tx, index) => (
              <TransactionRow key={index} transaction={tx} index={index} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
