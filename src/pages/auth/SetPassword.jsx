import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, XCircle, KeyRound, AlertTriangle } from 'lucide-react';

/**
 * Página de Definição de Senha via Link do Admin
 * Fluxo: Token da URL → Validação → Definir senha → Login
 */
export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Validação de força da senha
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error('Verifique os requisitos da senha');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('auth-set-password', {
        body: { token, password }
      });

      if (error) throw error;

      if (data?.success) {
        setSuccess(true);
        toast.success('Senha definida com sucesso!');
        
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          navigate('/custom-login');
        }, 2000);
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }

    } catch (error) {
      console.error('Erro ao definir senha:', error);
      
      if (error.message?.includes('expirado')) {
        setTokenValid(false);
        toast.error('Link expirado. Solicite um novo ao administrador.');
      } else if (error.message?.includes('inválido')) {
        setTokenValid(false);
        toast.error('Link inválido. Verifique se copiou corretamente.');
      } else {
        toast.error(error.message || 'Erro ao definir senha');
      }
    } finally {
      setLoading(false);
    }
  };

  // Estado de token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>
              Este link de redefinição de senha não é válido ou já expirou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Entre em contato com o administrador para solicitar um novo link de acesso.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/custom-login')} 
              className="w-full"
              variant="outline"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Senha Definida!</CardTitle>
            <CardDescription>
              Sua senha foi definida com sucesso. Redirecionando para o login...
            </CardDescription>
          </CardHeader>
          <CardContent>
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

  // Formulário principal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Defina sua Senha</CardTitle>
          <CardDescription>
            Crie uma senha segura para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Indicadores de força */}
            <div className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">Requisitos da senha:</p>
              <div className="grid grid-cols-2 gap-2">
                <PasswordRequirement met={hasMinLength} text="Mínimo 8 caracteres" />
                <PasswordRequirement met={hasUppercase} text="Letra maiúscula" />
                <PasswordRequirement met={hasLowercase} text="Letra minúscula" />
                <PasswordRequirement met={hasNumber} text="Número" />
              </div>
            </div>

            {/* Confirmação de senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Senha</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {confirmPassword && (
                <div className="flex items-center gap-1 text-sm">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Senhas conferem</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-destructive">Senhas não conferem</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isPasswordValid}
            >
              {loading ? 'Salvando...' : 'Definir Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente auxiliar para requisitos de senha
function PasswordRequirement({ met, text }) {
  return (
    <div className={`flex items-center gap-1 ${met ? 'text-green-500' : 'text-muted-foreground'}`}>
      {met ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );
}
