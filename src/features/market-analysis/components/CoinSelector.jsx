import React from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CoinSelector = ({ selectedCoin, onCoinChange, coins }) => {
  return (
    <Card className="p-4">
      <Label htmlFor="coin-select">Criptomoeda</Label>
      <Select onValueChange={onCoinChange} defaultValue={selectedCoin}>
        <SelectTrigger id="coin-select" className="w-full">
          <SelectValue placeholder="Selecione uma criptomoeda" />
        </SelectTrigger>
        <SelectContent>
          {coins?.map(coin => (
            <SelectItem key={coin.id} value={coin.id}>
              {coin.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
};

export default CoinSelector;