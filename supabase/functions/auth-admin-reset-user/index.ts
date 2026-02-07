import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /auth-admin-reset-user
 * Gera um link temporário para o usuário definir senha
 * Entrada: { user_id: string }
 * Saída: { success: true, reset_url: string, token: string, expires_at: string }
 * 
 * Fluxo: Admin gera link → Copia e envia manualmente → Usuário acessa e define senha
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[auth-admin-reset-user] Missing authorization header');
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
      console.error('[auth-admin-reset-user] Invalid session:', adminError);
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
      console.error('[auth-admin-reset-user] Access denied for user:', admin.id);
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ENTRADA: Validação do payload
    const body = await req.json();
    const user_id = typeof body?.user_id === 'string' ? body.user_id.trim() : '';
    
    // Validate user_id format
    if (!user_id || !UUID_REGEX.test(user_id)) {
      console.error('[auth-admin-reset-user] Invalid user_id format:', user_id);
      return new Response(
        JSON.stringify({ error: 'ID de usuário inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica se usuário existe e está ativo
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, status, email_verified_at')
      .eq('user_id', user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('[auth-admin-reset-user] User not found:', user_id);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Busca email do usuário via auth.users
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (authUserError || !authUser?.user?.email) {
      console.error('[auth-admin-reset-user] Auth user not found:', authUserError);
      return new Response(
        JSON.stringify({ error: 'Dados do usuário não encontrados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = authUser.user.email;

    // Invalida tokens anteriores do usuário
    await supabaseAdmin
      .from('verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .is('used_at', null);

    // Gera novo token de reset (válido por 24 horas para dar tempo ao admin enviar)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const { error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id,
        token: resetToken,
        token_type: 'password_reset',
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('[auth-admin-reset-user] Failed to create token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se email não foi verificado, marca como verificado (admin está garantindo a identidade)
    if (!userProfile.email_verified_at) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ email_verified_at: new Date().toISOString() })
        .eq('user_id', user_id);
      
      console.log('[auth-admin-reset-user] Email marked as verified for:', user_id);
    }

    // Garante que status está ativo
    if (userProfile.status !== 'active') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ status: 'active' })
        .eq('user_id', user_id);
      
      console.log('[auth-admin-reset-user] Status updated to active for:', user_id);
    }

    // Gera URL de reset - detecta ambiente automaticamente via Origin header
    const origin = req.headers.get('Origin') || req.headers.get('Referer');
    let siteUrl: string;
    
    if (origin) {
      try {
        siteUrl = new URL(origin).origin;
        console.log('[auth-admin-reset-user] Using origin from request:', siteUrl);
      } catch {
        siteUrl = Deno.env.get('SITE_URL') || 'https://compraouvenda.lovable.app';
      }
    } else {
      siteUrl = Deno.env.get('SITE_URL') || 'https://compraouvenda.lovable.app';
    }
    const resetUrl = `${siteUrl}/set-password?token=${resetToken}`;

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'admin_password_reset_generated',
      user_id,
      actor_id: admin.id,
      metadata: { 
        user_email: userEmail,
        token_expires_at: expiresAt.toISOString()
      },
      result: 'success'
    });

    console.log('[auth-admin-reset-user] Reset link generated successfully for:', userEmail);

    // SAÍDA: URL de reset
    return new Response(
      JSON.stringify({ 
        success: true,
        user_email: userEmail,
        reset_url: resetUrl,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        message: 'Copie o link e envie ao usuário'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[auth-admin-reset-user] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
