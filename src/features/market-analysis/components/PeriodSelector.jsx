import React from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PeriodSelector = ({ selectedDays, onDaysChange }) => {
  return (
    <Card className="p-4">
      <Label htmlFor="days-select">Período de Análise</Label>
      <Select 
        onValueChange={(value) => onDaysChange(Number(value))} 
        defaultValue={selectedDays.toString()}
      >
        <SelectTrigger id="days-select" className="w-full">
          <SelectValue placeholder="Selecione um período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="90">90 dias</SelectItem>
          <SelectItem value="180">180 dias</SelectItem>
          <SelectItem value="365">1 ano</SelectItem>
        </SelectContent>
      </Select>
    </Card>
  );
};

export default PeriodSelector;