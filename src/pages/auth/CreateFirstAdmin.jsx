import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateFirstAdmin() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({ email: false, password: false });

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError('');
    setCredentials(null);

    try {
      const { data, error } = await supabase.functions.invoke('auth-create-first-admin', {
        method: 'POST'
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
        toast.error(data.error);
        return;
      }

      if (data.success && data.credentials) {
        setCredentials(data.credentials);
        toast.success('Administrador criado com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao criar admin:', err);
      const msg = err?.message || 'Erro ao criar administrador';
      setError(msg);
      toast.error('Erro ao criar administrador');
      // Ajuda quando a Edge Function não responde (404 = não publicada no projeto)
      if (msg.includes('Failed to send') || err?.name === 'FunctionsFetchError') {
        setError(
          'Não foi possível contactar a Edge Function. ' +
          'Confirme que você fez o deploy no projeto Supabase do seu .env: ' +
          'no terminal execute "supabase link --project-ref SEU_PROJECT_REF" e depois "supabase functions deploy".'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [field]: true });
      toast.success(`${field === 'email' ? 'Email' : 'Senha'} copiado!`);
      setTimeout(() => {
        setCopied({ ...copied, [field]: false });
      }, 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Primeiro Administrador</CardTitle>
          <CardDescription>
            Esta função cria o primeiro usuário administrador do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!credentials ? (
            <>
              <Alert>
                <AlertDescription className="text-sm">
                  ⚠️ Esta função só pode ser executada UMA VEZ para criar o primeiro admin.
                  Depois disso, outros admins devem ser criados através do painel administrativo.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleCreateAdmin}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Criando administrador...' : 'Criar Administrador'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ✅ Administrador criado com sucesso! Guarde estas credenciais em local seguro.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-background rounded border text-sm">
                      {credentials.email}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.email, 'email')}
                    >
                      {copied.email ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Senha</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-background rounded border text-sm font-mono">
                      {credentials.password}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.password, 'password')}
                    >
                      {copied.password ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  <strong>User ID:</strong> {credentials.userId}
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  🔒 <strong>IMPORTANTE:</strong> Copie estas credenciais agora. Elas não serão exibidas novamente.
                  Você pode fazer login em <a href="/custom-login" className="text-primary underline">/custom-login</a>
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => window.location.href = '/custom-login'}
                className="w-full"
                variant="default"
              >
                Ir para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
