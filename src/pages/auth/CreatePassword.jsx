import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

/**
 * Página de Criação de Senha
 * Fluxo: Entrada de senha → Criação → Status pending (aguarda aprovação)
 */
export default function CreatePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem('verification_token');
    if (!token) {
      toast.error('Sessão expirada. Por favor, verifique seu email novamente.');
      navigate('/verify-email');
    }
  }, [navigate]);

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 12) errors.push('Mínimo 12 caracteres');
    if (!/[a-z]/.test(pwd)) errors.push('Letra minúscula');
    if (!/[A-Z]/.test(pwd)) errors.push('Letra maiúscula');
    if (!/[0-9]/.test(pwd)) errors.push('Número');
    if (!/[^a-zA-Z0-9]/.test(pwd)) errors.push('Caractere especial');
    return errors;
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      toast.error('Senha não atende aos requisitos');
      return;
    }

    setLoading(true);
    setPasswordErrors([]);

    try {
      const token = sessionStorage.getItem('verification_token');
      
      // Chama Edge Function auth-create-password com token
      const { data, error } = await supabase.functions.invoke('auth-create-password', {
        body: { email, password, verification_token: token }
      });

      if (error) throw error;

      if (data.error) {
        if (data.details) {
          setPasswordErrors(data.details);
        }
        throw new Error(data.error);
      }

      // Limpa token do sessionStorage
      sessionStorage.removeItem('verification_token');
      
      setSuccess(true);
      toast.success('Senha criada com sucesso!');

    } catch (error) {
      console.error('Erro ao criar senha:', error);
      toast.error(error.message || 'Erro ao criar senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle>Cadastro Completo!</CardTitle>
            <CardDescription>
              Sua conta foi criada e está aguardando aprovação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Um administrador irá revisar sua conta em breve. Você receberá uma
                notificação quando puder fazer login.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => navigate('/custom-login')}
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar Senha</CardTitle>
          <CardDescription>
            Defina uma senha forte para proteger sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePassword} className="space-y-4">
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
                placeholder="Mínimo 12 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              {passwordErrors.length > 0 && (
                <ul className="text-xs text-red-500 mt-1 list-disc list-inside">
                  {passwordErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Deve conter: 12+ caracteres, maiúsculas, minúsculas, números e caracteres especiais
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Confirmar Senha</label>
              <Input
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
