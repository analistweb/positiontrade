// ========================================
// 🔍 MARKET SURVEILLANCE - Status Engine
// ========================================

import { MarketStatus, SurveillanceMetrics } from './types';

interface StatusResult {
  status: MarketStatus;
  score: number;
  factors: StatusFactor[];
}

interface StatusFactor {
  name: string;
  contribution: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Calculate market manipulation status based on surveillance metrics
 * This is a pure function that does not modify any global state
 */
export function calculateMarketStatus(metrics: SurveillanceMetrics): MarketStatus {
  const result = calculateDetailedStatus(metrics);
  return result.status;
}

/**
 * Get detailed status with contributing factors
 */
export function calculateDetailedStatus(metrics: SurveillanceMetrics): StatusResult {
  const factors: StatusFactor[] = [];
  let totalScore = 0;

  // Factor 1: Volume Anomaly (25 points max)
  const volumeZScore = Math.abs(metrics.volumeMetrics.zScore);
  if (volumeZScore > 3) {
    factors.push({
      name: 'Volume Anormal',
      contribution: 25,
      description: `Z-Score de ${volumeZScore.toFixed(1)} indica volume extremamente fora do padrão`,
      severity: 'high',
    });
    totalScore += 25;
  } else if (volumeZScore > 2) {
    factors.push({
      name: 'Volume Elevado',
      contribution: 12,
      description: `Z-Score de ${volumeZScore.toFixed(1)} indica volume acima do normal`,
      severity: 'medium',
    });
    totalScore += 12;
  }

  // Factor 2: Order Book Imbalance (25 points max)
  const imbalance = Math.abs(metrics.orderBookMetrics.imbalanceRatio);
  if (imbalance > 0.7) {
    factors.push({
      name: 'Desbalanceamento Extremo',
      contribution: 25,
      description: `Ratio de ${(imbalance * 100).toFixed(0)}% entre compras e vendas`,
      severity: 'high',
    });
    totalScore += 25;
  } else if (imbalance > 0.5) {
    factors.push({
      name: 'Livro Desbalanceado',
      contribution: 12,
      description: `Ratio de ${(imbalance * 100).toFixed(0)}% indica pressão unilateral`,
      severity: 'medium',
    });
    totalScore += 12;
  }

  // Factor 3: Wash Trading (25 points max)
  const washScore = metrics.washTradingMetrics.repeatPatternScore;
  if (washScore > 0.4) {
    factors.push({
      name: 'Wash Trading Detectado',
      contribution: 25,
      description: `${(washScore * 100).toFixed(0)}% das trades mostram padrões repetitivos`,
      severity: 'high',
    });
    totalScore += 25;
  } else if (washScore > 0.2) {
    factors.push({
      name: 'Padrões Suspeitos',
      contribution: 12,
      description: `${(washScore * 100).toFixed(0)}% das trades podem ser artificiais`,
      severity: 'medium',
    });
    totalScore += 12;
  }

  // Factor 4: Spoofing (25 points max)
  const phantomScore = metrics.spoofingMetrics.phantomOrderScore;
  if (phantomScore > 0.3) {
    factors.push({
      name: 'Ordens Fantasma',
      contribution: 25,
      description: `${(phantomScore * 100).toFixed(0)}% das ordens grandes desaparecem rapidamente`,
      severity: 'high',
    });
    totalScore += 25;
  } else if (phantomScore > 0.15) {
    factors.push({
      name: 'Spoofing Possível',
      contribution: 12,
      description: `Ordens grandes canceladas acima do normal`,
      severity: 'medium',
    });
    totalScore += 12;
  }

  // Factor 5: Correlation Anomaly (bonus factor)
  if (!metrics.correlationMetrics.isNormalCorrelation) {
    const correlation = metrics.correlationMetrics.correlation;
    if (correlation < -0.3) {
      factors.push({
        name: 'Correlação Inversa',
        contribution: 10,
        description: `Preço e volume movendo em direções opostas`,
        severity: 'medium',
      });
      totalScore += 10;
    } else if (correlation > 0.9) {
      factors.push({
        name: 'Correlação Artificial',
        contribution: 10,
        description: `Correlação perfeita demais pode indicar manipulação`,
        severity: 'medium',
      });
      totalScore += 10;
    }
  }

  // Determine status based on total score
  let status: MarketStatus;
  if (totalScore >= 50) {
    status = 'MANIPULATED';
  } else if (totalScore >= 25) {
    status = 'ARTIFICIAL';
  } else {
    status = 'HEALTHY';
  }

  return {
    status,
    score: Math.min(totalScore, 100),
    factors,
  };
}

/**
 * Get human-readable status information
 */
export function getStatusInfo(status: MarketStatus) {
  const statusMap = {
    HEALTHY: {
      label: 'Mercado Saudável',
      description: 'Atividade de mercado dentro dos padrões normais. Operações podem prosseguir com confiança.',
      icon: '🟢',
      color: 'success' as const,
    },
    ARTIFICIAL: {
      label: 'Mercado Artificial',
      description: 'Padrões incomuns detectados. Recomenda-se cautela extra e análise adicional.',
      icon: '🟡',
      color: 'warning' as const,
    },
    MANIPULATED: {
      label: 'Mercado Manipulado',
      description: 'Sinais claros de manipulação ativa. Operações neste momento carregam risco elevado.',
      icon: '🔴',
      color: 'danger' as const,
    },
  };

  return statusMap[status];
}

/**
 * Get risk level (0-100) from status
 */
export function getRiskLevel(status: MarketStatus): number {
  switch (status) {
    case 'HEALTHY':
      return 20;
    case 'ARTIFICIAL':
      return 55;
    case 'MANIPULATED':
      return 90;
    default:
      return 50;
  }
}
