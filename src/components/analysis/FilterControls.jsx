
import React from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FilterControls = ({ 
  selectedCoin, 
  setSelectedCoin, 
  selectedDays, 
  setSelectedDays, 
  minVolume, 
  setMinVolume, 
  topCoins, 
  isLoadingCoins 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <Label htmlFor="coin-select">Criptomoeda</Label>
        <Select 
          onValueChange={setSelectedCoin} 
          defaultValue={selectedCoin}
          disabled={isLoadingCoins}
        >
          <SelectTrigger id="coin-select" className="w-full">
            <SelectValue placeholder="Selecione uma criptomoeda" />
          </SelectTrigger>
          <SelectContent>
            {!topCoins || topCoins.length === 0 ? (
              <SelectItem value="bitcoin">Bitcoin</SelectItem>
            ) : (
              topCoins.map(coin => (
                <SelectItem key={coin.id} value={coin.id}>
                  {coin.name} {coin.isFallbackData && '(Dados locais)'}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </Card>
      
      <Card className="p-4">
        <Label htmlFor="days-select">Período de Análise</Label>
        <Select 
          onValueChange={(value) => setSelectedDays(Number(value))} 
          defaultValue={selectedDays.toString()}
        >
          <SelectTrigger id="days-select" className="w-full">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
            <SelectItem value="180">180 dias</SelectItem>
            <SelectItem value="365">1 ano</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-4">
        <Label htmlFor="min-volume">Volume Mínimo (USD)</Label>
        <Input
          id="min-volume"
          type="number"
          value={minVolume}
          onChange={(e) => setMinVolume(Number(e.target.value))}
          placeholder="Digite o volume mínimo"
          className="w-full"
        />
      </Card>
    </div>
  );
};

export default FilterControls;
