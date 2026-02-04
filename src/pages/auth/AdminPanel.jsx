import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Shield, Link2, Copy, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Painel Administrativo
 * Fluxo: Lista usuários pending → Aprovar/Revogar → Gerar Link de Acesso
 */
export default function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);
  
  // Estado para modal de link gerado
  const [resetLinkDialog, setResetLinkDialog] = useState({
    open: false,
    url: '',
    email: '',
    expiresAt: ''
  });

  useEffect(() => {
    checkAdminRole();
    fetchPendingUsers();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado');
        window.location.href = '/custom-login';
        return;
      }

      // Valida admin SERVER-SIDE via Edge Function
      const { data, error } = await supabase.functions.invoke('admin-verify-role', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error || !data?.isAdmin) {
        toast.error('Acesso negado: apenas administradores');
        setIsAdmin(false);
        window.location.href = '/';
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      setIsAdmin(false);
      toast.error('Erro ao verificar permissões');
      window.location.href = '/';
    }
  };

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('admin-list-pending-users', {
        body: { status: 'pending', page: 1, limit: 50 },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      setPendingUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setProcessingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('admin-approve-user', {
        body: { user_id: userId, assigned_roles: ['user'] },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast.success('Usuário aprovado com sucesso!');
      
      // Após aprovar, gera o link de acesso automaticamente
      await handleGenerateResetLink(userId);
      
      fetchPendingUsers(); // Recarrega lista
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      toast.error('Erro ao aprovar usuário');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleGenerateResetLink = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('auth-admin-reset-user', {
        body: { user_id: userId },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        setResetLinkDialog({
          open: true,
          url: data.reset_url,
          email: data.user_email,
          expiresAt: new Date(data.expires_at).toLocaleString('pt-BR')
        });
      }

    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast.error('Erro ao gerar link de acesso');
    }
  };

  const handleRevoke = async (userId) => {
    if (!confirm('Tem certeza que deseja bloquear este usuário?')) return;

    setProcessingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('admin-revoke-user', {
        body: { user_id: userId, reason: 'Bloqueado pelo administrador' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast.success('Usuário bloqueado com sucesso!');
      fetchPendingUsers();
    } catch (error) {
      console.error('Erro ao revogar usuário:', error);
      toast.error('Erro ao bloquear usuário');
    } finally {
      setProcessingUserId(null);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copiado! Envie ao usuário via WhatsApp ou email.');
    } catch (error) {
      // Fallback para browsers antigos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Link copiado!');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta área é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <CardTitle>Painel Administrativo</CardTitle>
            </div>
            <CardDescription>
              Gerencie solicitações de cadastro de novos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Nenhum usuário aguardando aprovação no momento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <Card key={user.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{user.email}</h3>
                            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              <strong>Cadastrado em:</strong>{' '}
                              {new Date(user.created_at).toLocaleString('pt-BR')}
                            </p>
                            {user.email_verified_at && (
                              <p className="text-green-600 dark:text-green-400">
                                ✓ Email verificado em{' '}
                                {new Date(user.email_verified_at).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => handleApprove(user.id)}
                            disabled={processingUserId === user.id}
                            className="flex items-center gap-2"
                          >
                            {processingUserId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => handleGenerateResetLink(user.id)}
                            disabled={processingUserId === user.id}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Link2 className="w-4 h-4" />
                            Gerar Link
                          </Button>
                          <Button
                            onClick={() => handleRevoke(user.id)}
                            disabled={processingUserId === user.id}
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Bloquear
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal com link gerado */}
      <Dialog open={resetLinkDialog.open} onOpenChange={(open) => setResetLinkDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Link de Acesso Gerado
            </DialogTitle>
            <DialogDescription>
              Copie e envie este link para <strong>{resetLinkDialog.email}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                O usuário deve acessar este link para definir a senha e conseguir fazer login.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link de acesso:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resetLinkDialog.url}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm rounded-md border bg-muted font-mono break-all"
                />
                <Button
                  onClick={() => copyToClipboard(resetLinkDialog.url)}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>⏰ Expira em: <strong>{resetLinkDialog.expiresAt}</strong></p>
              <p className="mt-2">
                💡 Dica: Envie via WhatsApp, email pessoal ou qualquer outro meio seguro.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  const text = `Olá! Seu acesso foi aprovado. Use este link para definir sua senha: ${resetLinkDialog.url}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                variant="outline"
                className="flex-1"
              >
                Enviar via WhatsApp
              </Button>
              <Button
                onClick={() => setResetLinkDialog(prev => ({ ...prev, open: false }))}
                variant="secondary"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
