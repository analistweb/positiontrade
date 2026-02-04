import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * POST /auth-set-password
 * Define senha usando token gerado pelo admin
 * Entrada: { token: string, password: string }
 * Saída: { success: true, message: string }
 * 
 * Fluxo: Usuário recebe link → Acessa página → Define senha → Login habilitado
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ENTRADA: Validação do payload
    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    
    // Validações básicas
    if (!token) {
      console.error('[auth-set-password] Missing token');
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || password.length < 8) {
      console.error('[auth-set-password] Invalid password length');
      return new Response(
        JSON.stringify({ error: 'Senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validação de força da senha
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return new Response(
        JSON.stringify({ 
          error: 'Senha deve conter letras maiúsculas, minúsculas e números' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Busca token válido
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'password_reset')
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.error('[auth-set-password] Token not found or already used:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou já utilizado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica expiração
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error('[auth-set-password] Token expired:', tokenData.expires_at);
      return new Response(
        JSON.stringify({ error: 'Token expirado. Solicite um novo ao administrador.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user_id = tokenData.user_id;

    // Atualiza senha do usuário via Supabase Auth Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password }
    );

    if (updateError) {
      console.error('[auth-set-password] Failed to update password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao definir senha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marca token como usado
    await supabaseAdmin
      .from('verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Garante que usuário está ativo
    await supabaseAdmin
      .from('user_profiles')
      .update({ 
        status: 'active',
        email_verified_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'password_set_via_admin_link',
      user_id,
      metadata: { token_id: tokenData.id },
      result: 'success'
    });

    console.log('[auth-set-password] Password set successfully for user:', user_id);

    // SAÍDA: Sucesso
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Senha definida com sucesso! Você já pode fazer login.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[auth-set-password] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
