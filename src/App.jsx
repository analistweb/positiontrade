import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { navItems } from "./nav-items";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const queryClient = new QueryClient();

const HelpDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <HelpCircle className="h-6 w-6" />
        <span className="sr-only">Ajuda</span>
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Bem-vindo à Análise de Criptomoedas</DialogTitle>
        <DialogDescription className="space-y-4 pt-4">
          <p>
            Este painel foi projetado para ajudar você a entender e analisar o mercado de criptomoedas.
            Aqui está um guia rápido sobre cada seção:
          </p>
          <ul className="list-disc pl-6 space-y-2">
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
          <p className="text-sm text-muted-foreground mt-4">
            Dica: Passe o mouse sobre os elementos da interface para ver explicações detalhadas sobre suas funções.
          </p>
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

const App = () => {
  console.log("navItems:", navItems); // Debug log
  
  // More robust null check for navItems
  const safeNavItems = Array.isArray(navItems) ? navItems.filter(item => {
    // Ensure all required properties exist
    const isValid = item && 
      typeof item.title === 'string' && 
      typeof item.to === 'string' && 
      item.icon && 
      item.page;
    
    if (!isValid) {
      console.warn('Invalid nav item:', item);
    }
    return isValid;
  }) : [];
  
  console.log("safeNavItems:", safeNavItems); // Debug log
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="flex min-h-screen bg-background">
            <nav className="w-64 glass-morphism flex-shrink-0">
              <div className="flex flex-col h-full p-6 space-y-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                  Análise de Criptomoedas
                </h1>
                <ul className="flex-1 space-y-2">
                  {safeNavItems.map(({ title, to, icon, description }) => (
                    <motion.li
                      key={to}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={to}
                        className="flex items-center p-3 rounded-lg hover:bg-primary/20 transition-colors group relative"
                        aria-label={`Ir para ${title}`}
                      >
                        <span className="text-primary">{icon}</span>
                        <span className="ml-3 font-medium text-foreground">{title}</span>
                        {description && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-popover text-popover-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50">
                            <p className="text-sm">{description}</p>
                          </div>
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </nav>
            <main className="flex-1 p-6 overflow-y-auto">
              <div className="container mx-auto">
                <Routes>
                  {safeNavItems.map(({ to, page }) => (
                    <Route key={to} path={to} element={page} />
                  ))}
                </Routes>
              </div>
            </main>
            <HelpDialog />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;