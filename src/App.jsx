import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { navItems } from "./nav-items";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/common/MobileNav";
import { AuthStatus } from "@/components/common/AuthStatus";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Páginas de autenticação
import Register from "@/pages/auth/Register";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import CreatePassword from "@/pages/auth/CreatePassword";
import AdminPanel from "@/pages/auth/AdminPanel";
import CustomLogin from "@/pages/auth/CustomLogin";

const queryClient = new QueryClient();

const HelpDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg z-40 h-12 w-12 sm:h-14 sm:w-14"
      >
        <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="sr-only">Ajuda</span>
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl">Bem-vindo à Análise de Criptomoedas</DialogTitle>
        <DialogDescription className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 text-sm sm:text-base">
          <p>
            Este painel foi projetado para ajudar você a entender e analisar o mercado de criptomoedas.
            Aqui está um guia rápido sobre cada seção:
          </p>
          <ul className="list-disc pl-5 sm:pl-6 space-y-2">
            <li>
              <strong>Painel:</strong> Visão geral do mercado com indicadores importantes e tendências atuais.
            </li>
            <li>
              <strong>Análise de Compra/Venda:</strong> Ferramentas para ajudar na decisão de quando comprar ou vender,
              baseadas em indicadores técnicos.
            </li>
            <li>
              <strong>Posição da Carteira:</strong> Acompanhe suas criptomoedas e analise o desempenho do seu portfólio.
            </li>
            <li>
              <strong>Grupos de Entidades:</strong> Monitore as movimentações de grandes investidores e exchanges.
            </li>
            <li>
              <strong>Formação de Topo:</strong> Identifique possíveis pontos máximos de preço para tomar decisões informadas.
            </li>
            <li>
              <strong>Risco & Oportunidade:</strong> Avalie o momento do mercado e identifique oportunidades de investimento.
            </li>
            <li>
              <strong>Análise Técnica:</strong> Ferramentas avançadas para análise de preços e tendências.
            </li>
          </ul>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
            Dica: Passe o mouse sobre os elementos da interface para ver explicações detalhadas sobre suas funções.
          </p>
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

const AppContent = () => {
  const location = useLocation();
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex w-64 glass-morphism flex-shrink-0">
        <div className="flex flex-col h-full p-6 space-y-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Análise de Criptomoedas
          </h1>
          <ul className="flex-1 space-y-2">
            {navItems.map(({ title, to, icon, description }) => {
              const isActive = location.pathname === to;
              return (
                <motion.li
                  key={to}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={to}
                    className={`flex items-center p-3 rounded-lg transition-all group relative ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'hover:bg-primary/20'
                    }`}
                    aria-label={`Ir para ${title}`}
                  >
                    <span className={isActive ? 'text-primary-foreground' : 'text-primary'}>
                      {icon}
                    </span>
                    <span className="ml-3 font-medium text-foreground">{title}</span>
                    {description && !isActive && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-popover text-popover-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50">
                        <p className="text-sm">{description}</p>
                      </div>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
          
          {/* Auth Status */}
          <div className="pt-4 border-t border-border">
            <AuthStatus />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pt-16 lg:pt-6">
        <div className="container mx-auto max-w-7xl">
          <Routes>
            {/* Rotas principais - PROTEGIDAS */}
            {navItems.map(({ to, page }) => (
              <Route 
                key={to} 
                path={to} 
                element={
                  <ProtectedRoute>
                    {page}
                  </ProtectedRoute>
                } 
              />
            ))}
            
            {/* Rotas de autenticação (PÚBLICAS) */}
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/create-password" element={<CreatePassword />} />
            <Route path="/custom-login" element={<CustomLogin />} />
            
            {/* Admin Panel (PROTEGIDA - validação adicional dentro do componente) */}
            <Route 
              path="/admin-panel" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </main>

      {/* Help Button */}
      <HelpDialog />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;