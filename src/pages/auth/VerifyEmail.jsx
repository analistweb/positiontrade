import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Verificação de Email
 * Fluxo: Entrada de token → Validação → Redirecionamento para criação de senha
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chama Edge Function auth-verify-email
      const { data, error } = await supabase.functions.invoke('auth-verify-email', {
        body: { token }
      });

      if (error) throw error;

      toast.success('Email verificado com sucesso!');
      
      // Salva token no sessionStorage para usar no próximo passo
      sessionStorage.setItem('verification_token', token);
      
      // Redireciona para criação de senha
      setTimeout(() => {
        navigate('/create-password');
      }, 1000);

    } catch (error) {
      console.error('Erro ao verificar email:', error);
      toast.error(error.message || 'Token inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verificar Email</CardTitle>
          <CardDescription>
            Insira o token de verificação enviado para seu email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Token de Verificação</label>
              <Input
                type="text"
                placeholder="abc123-def456-..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Verifique seu email para encontrar o token
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Email'}
            </Button>

            <Alert>
              <AlertDescription className="text-xs">
                Não recebeu o email? Verifique sua pasta de spam ou solicite um novo token.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
