import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * POST /auth/create-password
 * Entrada: { email: string, password: string, user_id: string }
 * Processamento: Valida email verificado, define senha (Argon2id via Supabase), status permanece pending
 * Saída: 201 Created { status: "password_set", account_status: "pending" }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ENTRADA: Validação do payload
    const { email, password, verification_token } = await req.json();
    
    if (!email || !password || !verification_token) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Busca user_id pelo token de verificação
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .select('user_id, used_at')
      .eq('token', verification_token)
      .eq('token_type', 'email_verification')
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token de verificação inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData.used_at) {
      return new Response(
        JSON.stringify({ error: 'Email não verificado. Por favor, verifique seu email primeiro.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user_id = tokenData.user_id;

    // Rate limiting: 5 tentativas/hora por user_id
    const rateLimitId = `create-password:${user_id}`;
    const { data: recentAttempts } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', rateLimitId)
      .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registra tentativa
    await supabaseAdmin.from('rate_limit_attempts').insert({
      identifier: rateLimitId,
      attempted_at: new Date().toISOString()
    });

    // Validação robusta de senha
    const passwordErrors = [];
    if (password.length < 12) {
      passwordErrors.push('Mínimo 12 caracteres');
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('Letra minúscula');
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('Letra maiúscula');
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('Número');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      passwordErrors.push('Caractere especial');
    }

    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      passwordErrors.push('Senha muito comum');
    }

    if (passwordErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Senha não atende aos requisitos',
          details: passwordErrors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PROCESSAMENTO: Verifica se email foi verificado
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('email_verified_at, status')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.email_verified_at) {
      return new Response(
        JSON.stringify({ error: 'Email não verificado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define senha usando Supabase Auth (automaticamente usa Argon2id)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password }
    );

    if (updateError) {
      console.error('Erro ao definir senha:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar senha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'password_created',
      user_id,
      metadata: { email },
      result: 'success'
    });

    // SAÍDA: Senha criada, conta permanece pending
    return new Response(
      JSON.stringify({ 
        status: 'password_set',
        account_status: profile.status,
        message: 'Senha criada. Aguardando aprovação de administrador.'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /auth/create-password:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
