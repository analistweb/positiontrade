import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * POST /auth/refresh
 * Entrada: { refresh_token: string }
 * Processamento: Valida refresh token, rotaciona, emite novo par de tokens
 * Saída: 200 OK { access_token, refresh_token, expires_in }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ENTRADA: Validação do payload
    const { refresh_token } = await req.json();
    
    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: 'Refresh token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // PROCESSAMENTO: Tenta renovar sessão
    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token
    });

    if (error || !data.session) {
      return new Response(
        JSON.stringify({ error: 'Refresh token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica se conta ainda está ativa
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('status')
      .eq('user_id', data.user.id)
      .single();

    if (profile?.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Conta não autorizada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'token_refreshed',
      user_id: data.user.id,
      result: 'success'
    });

    // SAÍDA: Novos tokens
    return new Response(
      JSON.stringify({ 
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: 'Bearer'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /auth/refresh:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
