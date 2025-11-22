import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

/**
 * Painel Administrativo
 * Fluxo: Lista usuários pending → Aprovar/Revogar → Auditoria
 */
export default function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);

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
      fetchPendingUsers(); // Recarrega lista
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      toast.error('Erro ao aprovar usuário');
    } finally {
      setProcessingUserId(null);
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
                            <Badge variant="outline" className="bg-yellow-50">
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
                              <p className="text-green-600">
                                ✓ Email verificado em{' '}
                                {new Date(user.email_verified_at).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(user.id)}
                            disabled={processingUserId === user.id}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
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
    </div>
  );
}
