import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * POST /auth/logout
 * Entrada: Authorization header com access token
 * Processamento: Revoga sessão, invalida refresh token
 * Saída: 204 No Content
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PROCESSAMENTO: Faz logout no Supabase Auth
    const { error: logoutError } = await supabaseClient.auth.signOut();

    if (logoutError) {
      console.error('Erro ao fazer logout:', logoutError);
    }

    // Revoga refresh tokens customizados (se houver)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: now })
      .eq('user_id', user.id)
      .is('revoked_at', null);

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'logout',
      user_id: user.id,
      result: 'success'
    });

    // SAÍDA: Sem conteúdo
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Erro em /auth/logout:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
