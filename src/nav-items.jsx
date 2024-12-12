import { HomeIcon, TrendingUpIcon, WalletIcon, ActivityIcon, AlertTriangleIcon, BarChartIcon } from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import AnalisesCompraVenda from "./pages/AnalisesCompraVenda.jsx";
import PosicaoCarteira from "./pages/PosicaoCarteira.jsx";
import FormacaoTopo from "./pages/FormacaoTopo.jsx";
import RiscoOportunidade from "./pages/RiscoOportunidade.jsx";
import AnaliseTecnica from "./pages/AnaliseTecnica.jsx";

export const navItems = [
  {
    title: "Painel",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Dashboard />,
    description: "Visão geral do mercado com principais indicadores, tendências e notícias em tempo real"
  },
  {
    title: "Análise de Compra/Venda",
    to: "/analise-compra-venda",
    icon: <TrendingUpIcon className="h-4 w-4" />,
    page: <AnalisesCompraVenda />,
    description: "Analise o melhor momento para comprar ou vender baseado em indicadores técnicos e volume de negociação"
  },
  {
    title: "Carteira e Movimentações",
    to: "/posicao-carteira",
    icon: <WalletIcon className="h-4 w-4" />,
    page: <PosicaoCarteira />,
    description: "Acompanhe suas criptomoedas e analise movimentações de grandes investidores"
  },
  {
    title: "Formação de Topo",
    to: "/formacao-topo",
    icon: <ActivityIcon className="h-4 w-4" />,
    page: <FormacaoTopo />,
    description: "Identifique possíveis pontos máximos de preço para tomar decisões mais informadas"
  },
  {
    title: "Risco & Oportunidade",
    to: "/risco-oportunidade",
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    page: <RiscoOportunidade />,
    description: "Avalie o momento do mercado e identifique oportunidades de investimento com base em análise de risco"
  },
  {
    title: "Análise Técnica",
    to: "/analise-tecnica",
    icon: <BarChartIcon className="h-4 w-4" />,
    page: <AnaliseTecnica />,
    description: "Utilize ferramentas avançadas para análise de preços, tendências e indicadores técnicos"
  },
];