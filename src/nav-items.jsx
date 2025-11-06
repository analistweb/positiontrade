import { HomeIcon, TrendingUpIcon, WalletIcon, ActivityIcon, BarChartIcon, ZapIcon } from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import Index from "./pages/Index.jsx";
import AnalisesCompraVenda from "./pages/AnalisesCompraVenda.jsx";
import PosicaoCarteira from "./pages/PosicaoCarteira.jsx";
import FormacaoTopo from "./pages/FormacaoTopo.jsx";
import AnaliseTecnica from "./pages/AnaliseTecnica.jsx";
import EstrategiaETH from "./pages/EstrategiaETH.jsx";

export const navItems = [
  {
    title: "Painel",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
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
    title: "Estratégia ETHUSDT",
    to: "/estrategia-eth",
    icon: <ZapIcon className="h-4 w-4" />,
    page: <EstrategiaETH />,
    description: "Trading automatizado com Didi Index, DMI e rompimento em timeframe de 15 minutos"
  },
  {
    title: "Análise Técnica",
    to: "/analise-tecnica",
    icon: <BarChartIcon className="h-4 w-4" />,
    page: <AnaliseTecnica />,
    description: "Utilize ferramentas avançadas para análise de preços, tendências e indicadores técnicos"
  },
];