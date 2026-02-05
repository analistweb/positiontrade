import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente de Rota Protegida
 * Verifica:
 * 1. Se usuário está autenticado
 * 2. Se status da conta é 'active'
 * 3. Redireciona para login se não autenticado
 * 4. Mostra mensagem se conta está pending/blocked
 */
export const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);

  const checkAccountStatus = useCallback(async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('user_id', userId)
        .single();

      setAccountStatus(profile?.status || 'pending');
    } catch (error) {
      console.error('Erro ao verificar status da conta:', error);
      setAccountStatus('pending');
    }
  }, []);

  useEffect(() => {
    // 1. Setup listener PRIMEIRO para reagir a mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls para evitar deadlock
          setTimeout(() => {
            checkAccountStatus(session.user.id);
          }, 0);
        } else {
          setAccountStatus(null);
          setLoading(false);
        }
      }
    );

    // 2. DEPOIS verifica sessão existente
    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);
      await checkAccountStatus(session.user.id);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Não precisa redirecionar aqui - o listener vai detectar e o Navigate vai atuar
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Não autenticado - redireciona para login
  if (!user) {
    return <Navigate to="/custom-login" replace />;
  }

  // Conta bloqueada
  if (accountStatus === 'blocked') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold mb-2">Conta Bloqueada</p>
              <p className="text-sm mb-4">
                Sua conta foi bloqueada por um administrador. Entre em contato com o suporte para mais informações.
              </p>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Sair
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Conta pendente de aprovação
  if (accountStatus === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-md w-full">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold mb-2">Aguardando Aprovação</p>
              <p className="text-sm mb-4">
                Sua conta está aguardando aprovação de um administrador. Você receberá uma notificação quando puder acessar o sistema.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Sair
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Conta ativa - permite acesso
  return children;
};
