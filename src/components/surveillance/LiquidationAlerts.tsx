import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, MapPin } from 'lucide-react';
import { ProximityAlert } from '@/services/liquidation/types';

interface LiquidationAlertsProps {
  alerts: ProximityAlert[];
}

const LiquidationAlerts: React.FC<LiquidationAlertsProps> = React.memo(
  ({ alerts }) => {
    if (alerts.length === 0) {
      return (
        <Card className="bg-card border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                Preço atual distante de zonas de liquidação significativas
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-card border-yellow-500/30 border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-yellow-500" />
            Alertas de Proximidade
            <Badge
              variant="outline"
              className="ml-auto bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
            >
              {alerts.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                alert.isWithin
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-muted/30 border-border/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`h-4 w-4 mt-0.5 ${
                    alert.isWithin ? 'text-yellow-500' : 'text-muted-foreground'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        alert.type === 'PROJECTED'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {alert.type === 'PROJECTED' ? 'Projetada' : 'Histórica'}
                    </Badge>
                    {alert.isWithin && (
                      <Badge className="text-xs bg-yellow-500 text-yellow-950">
                        DENTRO DA ZONA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                  
                  {alert.type === 'PROJECTED' && 'confidence' in alert.zone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Confiança: {(alert.zone as { confidence: string }).confidence}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/20 rounded">
            <strong>Nota:</strong> Alertas indicam proximidade a zonas onde
            liquidações ocorreram ou podem ocorrer. Não constituem previsão de
            movimento de preço.
          </div>
        </CardContent>
      </Card>
    );
  }
);

LiquidationAlerts.displayName = 'LiquidationAlerts';

export default LiquidationAlerts;
