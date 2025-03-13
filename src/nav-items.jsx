
import { BarChart3, AreaChart, LineChart, Activity, Layers, Compass, TrendingUp } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import AnaliseTecnica from "./pages/AnaliseTecnica";
import BuySellAnalysis from "./pages/BuySellAnalysis";
import TopFormation from "./pages/TopFormation";
import RiskOpportunity from "./pages/RiskOpportunity";
import Index from "./pages/Index";
import EntityGroups from "./pages/EntityGroups";

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: <BarChart3 className="h-5 w-5" />,
    page: <Dashboard />,
    description: "Visão geral do mercado de criptomoedas com indicadores relevantes."
  },
  {
    title: "Análise de Compra/Venda",
    to: "/analise-compra-venda",
    icon: <Activity className="h-5 w-5" />,
    page: <BuySellAnalysis />,
    description: "Análise de oportunidades de compra e venda baseada em indicadores técnicos."
  },
  {
    title: "Formação de Topo",
    to: "/formacao-topo",
    icon: <AreaChart className="h-5 w-5" />,
    page: <TopFormation />,
    description: "Identificação de padrões de formação de topo de preços."
  },
  {
    title: "Análise Técnica",
    to: "/analise-tecnica",
    icon: <LineChart className="h-5 w-5" />,
    page: <AnaliseTecnica />,
    description: "Ferramentas avançadas para análise técnica de criptomoedas."
  },
  {
    title: "Risco vs Oportunidade",
    to: "/risco-oportunidade",
    icon: <TrendingUp className="h-5 w-5" />,
    page: <RiskOpportunity />,
    description: "Avaliação do equilíbrio entre risco e oportunidade de investimento."
  },
  {
    title: "Grupos de Entidades",
    to: "/entity-groups",
    icon: <Layers className="h-5 w-5" />,
    page: <EntityGroups />,
    description: "Análise do comportamento de grandes entidades no mercado."
  },
];
