import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { Settings, RotateCcw, Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const ParameterControl = ({ label, value, onChange, min, max, step, unit = '', description }) => (
  <div className="space-y-3 p-4 rounded-lg bg-muted/30">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Badge variant="outline" className="font-mono">
        {value}{unit}
      </Badge>
    </div>
    <Slider
      value={[value]}
      onValueChange={(vals) => onChange(vals[0])}
      min={min}
      max={max}
      step={step}
      className="w-full"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

const ParametersPanel = ({ onParametersChange, isCollapsed = false }) => {
  // Parâmetros padrão da estratégia
  const defaultParams = {
    adxThreshold: 25,
    rsiOverbought: 70,
    rsiOversold: 30,
    emaLength: 50,
    atrPeriod: 14,
    volumeMultiplier: 1.0,
    breakoutThreshold: 0.05,
    minMarketStrength: 60,
    riskRewardRatio: 1.0,
    enableVolumeFilter: true,
    enableRSIFilter: true,
    enableMACDFilter: true,
    enableOBVFilter: true
  };

  const [params, setParams] = useState(defaultParams);
  const [hasChanges, setHasChanges] = useState(false);

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setParams(defaultParams);
    setHasChanges(false);
    toast.info('Parâmetros restaurados para o padrão');
  };

  const handleApply = () => {
    if (onParametersChange) {
      onParametersChange(params);
    }
    setHasChanges(false);
    toast.success('Parâmetros aplicados com sucesso!');
  };

  if (isCollapsed) {
    return (
      <Button variant="outline" className="w-full" onClick={() => {}}>
        <Settings className="w-4 h-4 mr-2" />
        Configurar Parâmetros
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Personalização de Parâmetros
            </CardTitle>
            {hasChanges && (
              <Badge variant="default" className="animate-pulse">
                Alterado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
          {/* Indicadores Técnicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Indicadores Técnicos
            </h3>
            
            <ParameterControl
              label="Limite ADX"
              value={params.adxThreshold}
              onChange={(v) => handleParamChange('adxThreshold', v)}
              min={15}
              max={40}
              step={1}
              description="Força mínima da tendência"
            />

            <ParameterControl
              label="RSI Sobrecomprado"
              value={params.rsiOverbought}
              onChange={(v) => handleParamChange('rsiOverbought', v)}
              min={60}
              max={85}
              step={1}
              description="Limite superior do RSI"
            />

            <ParameterControl
              label="RSI Sobrevendido"
              value={params.rsiOversold}
              onChange={(v) => handleParamChange('rsiOversold', v)}
              min={15}
              max={40}
              step={1}
              description="Limite inferior do RSI"
            />

            <ParameterControl
              label="Período EMA"
              value={params.emaLength}
              onChange={(v) => handleParamChange('emaLength', v)}
              min={20}
              max={200}
              step={10}
              description="Média móvel exponencial"
            />

            <ParameterControl
              label="Período ATR"
              value={params.atrPeriod}
              onChange={(v) => handleParamChange('atrPeriod', v)}
              min={7}
              max={28}
              step={1}
              description="Cálculo de volatilidade"
            />
          </div>

          {/* Filtros de Entrada */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold">Filtros de Entrada</h3>
            
            <ParameterControl
              label="Multiplicador de Volume"
              value={params.volumeMultiplier}
              onChange={(v) => handleParamChange('volumeMultiplier', v)}
              min={0.5}
              max={2.0}
              step={0.1}
              unit="x"
              description="Volume mínimo vs média"
            />

            <ParameterControl
              label="Threshold de Rompimento"
              value={params.breakoutThreshold}
              onChange={(v) => handleParamChange('breakoutThreshold', v)}
              min={0.01}
              max={0.20}
              step={0.01}
              unit="%"
              description="% mínima para validar rompimento"
            />

            <ParameterControl
              label="Força de Mercado Mínima"
              value={params.minMarketStrength}
              onChange={(v) => handleParamChange('minMarketStrength', v)}
              min={40}
              max={80}
              step={5}
              description="Score mínimo para sinal"
            />

            <ParameterControl
              label="Razão Risco:Recompensa"
              value={params.riskRewardRatio}
              onChange={(v) => handleParamChange('riskRewardRatio', v)}
              min={0.5}
              max={3.0}
              step={0.1}
              unit=":1"
              description="R:R mínimo exigido"
            />
          </div>

          {/* Filtros Booleanos */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold">Filtros Avançados</h3>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Filtro de Volume</Label>
                <p className="text-xs text-muted-foreground">
                  Exigir volume acima da média
                </p>
              </div>
              <Switch
                checked={params.enableVolumeFilter}
                onCheckedChange={(checked) => handleParamChange('enableVolumeFilter', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Filtro RSI</Label>
                <p className="text-xs text-muted-foreground">
                  Evitar zonas de sobrecompra/sobrevenda
                </p>
              </div>
              <Switch
                checked={params.enableRSIFilter}
                onCheckedChange={(checked) => handleParamChange('enableRSIFilter', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Filtro MACD</Label>
                <p className="text-xs text-muted-foreground">
                  Confirmar momentum com MACD
                </p>
              </div>
              <Switch
                checked={params.enableMACDFilter}
                onCheckedChange={(checked) => handleParamChange('enableMACDFilter', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Filtro OBV</Label>
                <p className="text-xs text-muted-foreground">
                  Confirmar com tendência de volume
                </p>
              </div>
              <Switch
                checked={params.enableOBVFilter}
                onCheckedChange={(checked) => handleParamChange('enableOBVFilter', checked)}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            ⚠️ Mudanças afetarão novos sinais gerados
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ParametersPanel;
