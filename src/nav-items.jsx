import { HomeIcon, TrendingUpIcon, WalletIcon, UsersIcon, ActivityIcon, AlertTriangleIcon } from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import BuySellAnalysis from "./pages/BuySellAnalysis.jsx";
import PortfolioPosition from "./pages/PortfolioPosition.jsx";
import EntityGroups from "./pages/EntityGroups.jsx";
import TopFormation from "./pages/TopFormation.jsx";
import RiskOpportunity from "./pages/RiskOpportunity.jsx";

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Dashboard />,
  },
  {
    title: "Buy/Sell Analysis",
    to: "/buy-sell-analysis",
    icon: <TrendingUpIcon className="h-4 w-4" />,
    page: <BuySellAnalysis />,
  },
  {
    title: "Portfolio Position",
    to: "/portfolio-position",
    icon: <WalletIcon className="h-4 w-4" />,
    page: <PortfolioPosition />,
  },
  {
    title: "Entity Groups",
    to: "/entity-groups",
    icon: <UsersIcon className="h-4 w-4" />,
    page: <EntityGroups />,
  },
  {
    title: "Top Formation",
    to: "/top-formation",
    icon: <ActivityIcon className="h-4 w-4" />,
    page: <TopFormation />,
  },
  {
    title: "Risk & Opportunity",
    to: "/risk-opportunity",
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    page: <RiskOpportunity />,
  },
];