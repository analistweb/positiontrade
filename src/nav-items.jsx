
import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp,
  LineChart,
  Brain
} from "lucide-react";
import Dashboard from './pages/Dashboard';
import BuySellAnalysis from './pages/BuySellAnalysis';
import FormacaoTopo from './pages/FormacaoTopo';
import AnaliseTecnica from './pages/AnaliseTecnica';

export const navItems = [
  {
    title: "Painel",
    to: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
    page: <Dashboard />,
    description: "Visão geral do mercado com indicadores importantes"
  },
  {
    title: "Análise de Compra/Venda",
    to: "/analise-compra-venda",
    icon: <TrendingUp className="h-5 w-5" />,
    page: <BuySellAnalysis />,
    description: "Análise detalhada para decisões de compra e venda"
  },
  {
    title: "Formação de Topo",
    to: "/formacao-topo",
    icon: <Brain className="h-5 w-5" />,
    page: <FormacaoTopo />,
    description: "Identificação de padrões de formação de topo"
  },
  {
    title: "Análise Técnica",
    to: "/analise-tecnica",
    icon: <LineChart className="h-5 w-5" />,
    page: <AnaliseTecnica />,
    description: "Indicadores técnicos e análise de tendências"
  }
];
