import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';

/**
 * Página de Login Customizado
 * Fluxo: Entrada de credenciais → Validação de status → Emissão de tokens
 */
export default function CustomLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Chama Edge Function auth-custom-login
      const { data, error: loginError } = await supabase.functions.invoke('auth-custom-login', {
        body: { email, password }
      });

      if (loginError) throw loginError;

      if (data.error) {
        setError(data.error);
        toast.error(data.error);
        return;
      }

      // Login bem-sucedido
      toast.success('Login realizado com sucesso!');
      
      // Redireciona baseado em role
      if (data.user.roles.includes('admin')) {
        navigate('/admin-panel');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError(error.message || 'Erro ao fazer login');
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="w-6 h-6 text-primary" />
            <CardTitle>Login</CardTitle>
          </div>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Não tem conta?{' '}
                <a href="/register" className="text-primary hover:underline">
                  Cadastre-se
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Administrador?{' '}
                <a href="/admin-panel" className="text-primary hover:underline">
                  Painel Admin
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
