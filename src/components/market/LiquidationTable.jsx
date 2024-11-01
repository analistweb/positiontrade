import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LiquidationTable = ({ liquidations }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Exchange</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Valor (USD)</TableHead>
        <TableHead>Tempo</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {liquidations.map((liq, index) => (
        <TableRow key={index}>
          <TableCell>{liq.exchange}</TableCell>
          <TableCell>
            <span className={liq.type === 'long' ? 'text-green-500' : 'text-red-500'}>
              {liq.type.toUpperCase()}
            </span>
          </TableCell>
          <TableCell>${(liq.amount / 1000000).toFixed(2)}M</TableCell>
          <TableCell>{new Date(liq.timestamp).toLocaleTimeString()}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default LiquidationTable;