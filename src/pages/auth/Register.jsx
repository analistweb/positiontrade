import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Página de Cadastro
 * Fluxo: Entrada de email → Envio de token de verificação
 */
export default function Register() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Chama Edge Function auth-register
      const { data, error } = await supabase.functions.invoke('auth-register', {
        body: { email }
      });

      if (error) throw error;

      setSuccess(true);
      setDevToken(data._dev_token || ''); // Token de desenvolvimento
      toast.success('Verificação enviada! Verifique seu email.');

    } catch (error) {
      console.error('Erro ao registrar:', error);
      toast.error(error.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Cadastre-se para começar. Sua conta será revisada por um administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Um email de verificação foi enviado para <strong>{email}</strong>.
                  Verifique sua caixa de entrada e siga as instruções.
                </AlertDescription>
              </Alert>

              {devToken && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-sm">
                    <strong>Token de desenvolvimento:</strong>
                    <br />
                    <code className="text-xs bg-white p-2 block mt-2 rounded">
                      {devToken}
                    </code>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Use este token na próxima tela (modo dev).
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => window.location.href = '/verify-email'}
                className="w-full"
              >
                Ir para Verificação
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processando...' : 'Criar Conta'}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Já tem conta?{' '}
                <a href="/custom-login" className="text-primary hover:underline">
                  Fazer login
                </a>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
