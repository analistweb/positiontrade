import { HomeIcon, TrendingUpIcon, WalletIcon, UsersIcon, ActivityIcon, AlertTriangleIcon } from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import AnalisesCompraVenda from "./pages/AnalisesCompraVenda.jsx";
import PosicaoCarteira from "./pages/PosicaoCarteira.jsx";
import GruposEntidades from "./pages/GruposEntidades.jsx";
import FormacaoTopo from "./pages/FormacaoTopo.jsx";
import RiscoOportunidade from "./pages/RiscoOportunidade.jsx";

export const navItems = [
  {
    title: "Painel",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Dashboard />,
  },
  {
    title: "Análise de Compra/Venda",
    to: "/analise-compra-venda",
    icon: <TrendingUpIcon className="h-4 w-4" />,
    page: <AnalisesCompraVenda />,
  },
  {
    title: "Posição da Carteira",
    to: "/posicao-carteira",
    icon: <WalletIcon className="h-4 w-4" />,
    page: <PosicaoCarteira />,
  },
  {
    title: "Grupos de Entidades",
    to: "/grupos-entidades",
    icon: <UsersIcon className="h-4 w-4" />,
    page: <GruposEntidades />,
  },
  {
    title: "Formação de Topo",
    to: "/formacao-topo",
    icon: <ActivityIcon className="h-4 w-4" />,
    page: <FormacaoTopo />,
  },
  {
    title: "Risco & Oportunidade",
    to: "/risco-oportunidade",
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    page: <RiscoOportunidade />,
  },
];