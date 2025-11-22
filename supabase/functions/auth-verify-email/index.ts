import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * POST /auth/verify-email
 * Entrada: { token: string }
 * Processamento: Valida token, marca email verificado, invalida token
 * Saída: 200 OK { status: "email_verified", next: "/create-password" }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ENTRADA: Validação do payload
    const { token } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // PROCESSAMENTO: Busca e valida token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'email_verification')
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica expiração
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Token expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marca email como verificado no user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ email_verified_at: now.toISOString() })
      .eq('user_id', tokenData.user_id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marca token como usado
    const { error: updateTokenError } = await supabaseAdmin
      .from('verification_tokens')
      .update({ used_at: now.toISOString() })
      .eq('id', tokenData.id);

    if (updateTokenError) {
      console.error('Erro ao invalidar token:', updateTokenError);
    }

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'email_verified',
      user_id: tokenData.user_id,
      metadata: { token_id: tokenData.id },
      result: 'success'
    });

    // SAÍDA: Confirmação de verificação
    return new Response(
      JSON.stringify({ 
        status: 'email_verified',
        next: '/create-password',
        user_id: tokenData.user_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /auth/verify-email:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
