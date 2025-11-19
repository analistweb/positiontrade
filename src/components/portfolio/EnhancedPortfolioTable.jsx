import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CryptoImage from '../common/CryptoImage';
import { TrendingUp, TrendingDown, Plus, Edit2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EnhancedPortfolioTable = ({ portfolioData, onUpdateHolding }) => {
  const [editingCoin, setEditingCoin] = useState(null);
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const totalValue = portfolioData?.reduce((acc, coin) => 
    acc + (coin.quantity * coin.current_price), 0) || 0;

  const calculateMetrics = (coin) => {
    const currentValue = coin.quantity * coin.current_price;
    const investedValue = coin.quantity * (coin.avg_buy_price || coin.current_price);
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = investedValue > 0 ? ((profitLoss / investedValue) * 100) : 0;
    const portfolioPercent = totalValue > 0 ? ((currentValue / totalValue) * 100) : 0;

    return {
      currentValue,
      investedValue,
      profitLoss,
      profitLossPercent,
      portfolioPercent
    };
  };

  const handleSave = () => {
    if (editingCoin && buyPrice && quantity) {
      onUpdateHolding?.(editingCoin.id, {
        avg_buy_price: parseFloat(buyPrice),
        quantity: parseFloat(quantity)
      });
      setEditingCoin(null);
      setBuyPrice('');
      setQuantity('');
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span>Detalhamento dos Ativos</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Clique no botão de edição para adicionar seu preço médio de compra e calcular lucros reais
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs sm:text-sm">
                <TableHead className="min-w-[140px]">Ativo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Valor Total</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right hidden md:table-cell">% Carteira</TableHead>
                <TableHead className="text-right">24h</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioData?.map((coin, index) => {
                const metrics = calculateMetrics(coin);
                const isProfit = metrics.profitLoss >= 0;

                return (
                  <motion.tr
                    key={coin.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 text-xs sm:text-sm"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CryptoImage 
                          src={coin.image} 
                          alt={coin.name}
                          symbol={coin.symbol}
                          className="w-6 h-6 sm:w-8 sm:h-8"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{coin.symbol.toUpperCase()}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                            {coin.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right font-medium">
                      {coin.quantity}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      ${coin.current_price.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </TableCell>
                    
                    <TableCell className="text-right font-semibold hidden sm:table-cell">
                      ${metrics.currentValue.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold text-xs sm:text-sm ${
                          isProfit ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {isProfit ? '+' : ''}${Math.abs(metrics.profitLoss).toLocaleString('en-US', { 
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0 
                          })}
                        </span>
                        <span className={`text-[10px] sm:text-xs ${
                          isProfit ? 'text-green-500/70' : 'text-red-500/70'
                        }`}>
                          {isProfit ? '+' : ''}{metrics.profitLossPercent.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {metrics.portfolioPercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Badge 
                        variant={coin.price_change_percentage_24h > 0 ? "default" : "destructive"}
                        className={`font-semibold text-[10px] sm:text-xs ${
                          coin.price_change_percentage_24h > 0 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {coin.price_change_percentage_24h > 0 ? '+' : ''}
                        {coin.price_change_percentage_24h.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center hidden sm:table-cell">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingCoin(coin);
                              setBuyPrice(coin.avg_buy_price?.toString() || '');
                              setQuantity(coin.quantity.toString());
                            }}
                          >
                            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">
                              Editar {coin.symbol.toUpperCase()}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="quantity" className="text-sm">Quantidade</Label>
                              <Input
                                id="quantity"
                                type="number"
                                step="0.00000001"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Ex: 1.5"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="buyPrice" className="text-sm">Preço Médio de Compra (USD)</Label>
                              <Input
                                id="buyPrice"
                                type="number"
                                step="0.01"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                placeholder="Ex: 45000.00"
                                className="text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                Preço atual: ${coin.current_price.toLocaleString()}
                              </p>
                            </div>
                            <Button onClick={handleSave} className="w-full">
                              Salvar Alterações
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPortfolioTable;
