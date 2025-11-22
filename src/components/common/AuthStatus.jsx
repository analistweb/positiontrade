import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogIn, LogOut, Shield, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

/**
 * Componente de Status de Autenticação
 * Mostra botão de login ou menu do usuário autenticado
 */
export const AuthStatus = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAdminRole(session.user.id);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminRole = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.functions.invoke('admin-verify-role', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      setIsAdmin(data?.isAdmin === true);
    } catch (error) {
      console.error('Erro ao verificar role admin:', error);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase.functions.invoke('auth-logout', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      }

      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return null;
  }

  // Usuário não autenticado
  if (!user) {
    return (
      <Button
        onClick={() => navigate('/custom-login')}
        variant="outline"
        className="flex items-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

  // Usuário autenticado
  const userInitial = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Conta</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                <Shield className="w-3 h-3" />
                Administrador
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => navigate('/admin-panel')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Painel Admin</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
