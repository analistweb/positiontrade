import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * POST /admin/users/:id/revoke
 * Entrada: { user_id: string, reason?: string }
 * Processamento: Altera status para 'blocked', revoga refresh tokens (requer role admin)
 * Saída: 200 OK { userId, new_status: "blocked" }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: admin }, error: adminError } = await supabaseClient.auth.getUser();
    
    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica se é admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', admin.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ENTRADA: Validação do payload
    const { user_id, reason } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'ID de usuário não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // PROCESSAMENTO: Altera status para 'blocked'
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ status: 'blocked' })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao revogar acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revoga todos os refresh tokens do usuário
    const now = new Date().toISOString();
    const { error: revokeError } = await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: now })
      .eq('user_id', user_id)
      .is('revoked_at', null);

    if (revokeError) {
      console.error('Erro ao revogar tokens:', revokeError);
    }

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'user_revoked',
      user_id,
      actor_id: admin.id,
      metadata: { reason: reason || 'Não especificado' },
      result: 'success'
    });

    // SAÍDA: Confirmação de revogação
    return new Response(
      JSON.stringify({ 
        userId: user_id,
        new_status: 'blocked'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /admin/users/:id/revoke:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
