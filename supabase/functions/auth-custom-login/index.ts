import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * POST /auth/login
 * Entrada: { email: string, password: string }
 * Processamento: Valida credenciais, verifica status 'active', emite tokens
 * Saída: 200 OK { access_token, refresh_token, user }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ENTRADA: Validação do payload
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Credenciais incompletas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 5 tentativas/5 min por email
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rateLimitId = `login:${email}`;
    const { data: recentAttempts } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', rateLimitId)
      .gte('attempted_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 5 minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registra tentativa
    await supabaseAdmin.from('rate_limit_attempts').insert({
      identifier: rateLimitId,
      attempted_at: new Date().toISOString()
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // PROCESSAMENTO: Tenta autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      await supabaseAdmin.from('audit_events').insert({
        event_type: 'login_failed',
        metadata: { email, reason: 'Credenciais inválidas' },
        result: 'failure'
      });

      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas ou conta não autorizada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('status')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabaseAdmin.from('audit_events').insert({
        event_type: 'login_failed',
        user_id: authData.user.id,
        metadata: { email, reason: 'Perfil não encontrado' },
        result: 'failure'
      });

      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bloqueia login se status != active (mensagem genérica)
    if (profile.status !== 'active') {
      await supabaseAdmin.from('audit_events').insert({
        event_type: 'login_denied',
        user_id: authData.user.id,
        metadata: { email, status: profile.status },
        result: 'denied'
      });

      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas ou conta não autorizada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Busca roles do usuário
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id);

    const roles = userRoles?.map(r => r.role) || [];

    // Log de sucesso
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'login_success',
      user_id: authData.user.id,
      metadata: { email, roles },
      result: 'success'
    });

    // SAÍDA: Tokens e dados do usuário
    return new Response(
      JSON.stringify({ 
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        token_type: 'Bearer',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          roles,
          status: profile.status
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /auth/login:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
