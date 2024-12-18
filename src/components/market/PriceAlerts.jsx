import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PriceAlerts = ({ currentPrice, symbol = "BTC" }) => {
  const [alerts, setAlerts] = useState(() => {
    const savedAlerts = localStorage.getItem('priceAlerts');
    return savedAlerts ? JSON.parse(savedAlerts) : [];
  });
  const [newAlertPrice, setNewAlertPrice] = useState('');

  const addAlert = () => {
    if (!newAlertPrice || isNaN(newAlertPrice)) {
      toast.error("Por favor, insira um preço válido");
      return;
    }

    const price = parseFloat(newAlertPrice);
    const newAlert = {
      id: Date.now(),
      price,
      symbol,
      type: price > currentPrice ? 'above' : 'below'
    };

    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    localStorage.setItem('priceAlerts', JSON.stringify(updatedAlerts));
    setNewAlertPrice('');
    
    toast.success(`Alerta configurado para ${symbol} ${newAlert.type === 'above' ? 'acima' : 'abaixo'} de $${price.toLocaleString()}`);
  };

  const removeAlert = (id) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== id);
    setAlerts(updatedAlerts);
    localStorage.setItem('priceAlerts', JSON.stringify(updatedAlerts));
    toast.success("Alerta removido com sucesso");
  };

  React.useEffect(() => {
    if (!currentPrice) return;

    alerts.forEach(alert => {
      if (alert.type === 'above' && currentPrice >= alert.price) {
        toast.info(`${symbol} atingiu o preço alvo de $${alert.price.toLocaleString()}!`);
      } else if (alert.type === 'below' && currentPrice <= alert.price) {
        toast.info(`${symbol} atingiu o preço alvo de $${alert.price.toLocaleString()}!`);
      }
    });
  }, [currentPrice, alerts, symbol]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas de Preço
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              value={newAlertPrice}
              onChange={(e) => setNewAlertPrice(e.target.value)}
              placeholder="Digite o preço alvo..."
              className="flex-1"
            />
            <Button onClick={addAlert}>
              Adicionar Alerta
            </Button>
          </div>
          
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-card/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={alert.type === 'above' ? "success" : "destructive"}>
                    {alert.type === 'above' ? '↑' : '↓'}
                  </Badge>
                  <span>${alert.price.toLocaleString()}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceAlerts;