
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { formatDate, formatCurrency } from '@/lib/utils';
import TransactionRow from './TransactionRow';

const TransactionList = ({ transactions }) => {
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
          {transactions?.map((tx, index) => (
            <TransactionRow key={index} transaction={tx} index={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
