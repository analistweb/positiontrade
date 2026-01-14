import { HomeIcon, TrendingUpIcon, WalletIcon, ActivityIcon, BarChartIcon, ZapIcon, Radio, FlaskConical } from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import Index from "./pages/Index.jsx";
import AnalisesCompraVenda from "./pages/AnalisesCompraVenda.jsx";
import PosicaoCarteira from "./pages/PosicaoCarteira.jsx";
import FormacaoTopo from "./pages/FormacaoTopo.jsx";
import AnaliseTecnica from "./pages/AnaliseTecnica.jsx";
import EstrategiaETH from "./pages/EstrategiaETH.jsx";
import SinaisTrade from "./pages/SinaisTrade.jsx";
import AsymmetricEdgeTest from "./pages/AsymmetricEdgeTest.tsx";

export const navItems = [
  {
    title: "Painel",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
    description: "Visão geral do mercado com principais indicadores, tendências e notícias em tempo real"
  },
  {
    title: "Sinais de Trade",
    to: "/sinais-trade",
    icon: <Radio className="h-4 w-4" />,
    page: <SinaisTrade />,
    description: "Sinais em tempo real para BTC, ETH e outras criptomoedas com estratégia M15"
  },
  {
    title: "Análise de Compra/Venda",
    to: "/analise-compra-venda",
    icon: <TrendingUpIcon className="h-4 w-4" />,
    page: <AnalisesCompraVenda />,
    description: "Analise o melhor momento para comprar ou vender baseado em indicadores técnicos e volume de negociação"
  },
  {
    title: "Atividade das Baleias",
    to: "/posicao-carteira",
    icon: <WalletIcon className="h-4 w-4" />,
    page: <PosicaoCarteira />,
    description: "Monitore as movimentações dos grandes investidores em tempo real"
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
  {
    title: "ASYMMETRIC EDGE TEST",
    to: "/asymmetric-edge",
    icon: <FlaskConical className="h-4 w-4" />,
    page: <AsymmetricEdgeTest />,
    description: "Validação estatística da estratégia ASYMMETRIC_EDGE_V2 com backtest e Monte Carlo"
  },
];