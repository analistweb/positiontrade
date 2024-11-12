import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { navItems } from "./nav-items";
import { motion } from "framer-motion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <div className="flex h-screen bg-background text-foreground">
          <nav className="w-64 glass-morphism">
            <div className="p-6 space-y-6">
              <h1 className="text-2xl font-bold gradient-text">
                Análise de Criptomoedas
              </h1>
              <ul className="space-y-2">
                {navItems.map(({ title, to, icon }) => (
                  <motion.li
                    key={to}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={to}
                      className="flex items-center p-3 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <span className="text-primary">{icon}</span>
                      <span className="ml-3 font-medium">{title}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </nav>
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={page} />
              ))}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;