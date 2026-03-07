import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { navItems } from "./nav-items";
import { EditorialHeader } from "@/components/layout/EditorialHeader";
import { EditorialFooter } from "@/components/layout/EditorialFooter";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

// Páginas de autenticação
import Register from "@/pages/auth/Register";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import CreatePassword from "@/pages/auth/CreatePassword";
import SetPassword from "@/pages/auth/SetPassword";
import AdminPanel from "@/pages/auth/AdminPanel";
import CustomLogin from "@/pages/auth/CustomLogin";
import CreateFirstAdmin from "@/pages/auth/CreateFirstAdmin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EditorialHeader />
      
      {/* Main Content */}
      <main className="flex-1 pt-16 lg:pt-20">
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
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/custom-login" element={<CustomLogin />} />
          <Route path="/create-first-admin" element={<CreateFirstAdmin />} />
          
          {/* Admin Panel (PROTEGIDA) */}
          <Route 
            path="/admin-panel" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <EditorialFooter />
    </div>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
