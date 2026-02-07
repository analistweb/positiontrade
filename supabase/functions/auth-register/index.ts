import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 255;

/**
 * POST /auth/register
 * Entrada: { email: string }
 * Processamento: Cria usuário pending, gera token de verificação, envia email
 * Saída: 202 Accepted
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ENTRADA: Validação do payload
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    
    // Comprehensive email validation
    if (!email || !EMAIL_REGEX.test(email) || email.length > MAX_EMAIL_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente Supabase com service_role para operações privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Rate limiting: 3 accounts/hour per IP (check BEFORE user operations)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimitId = `register:${clientIp}`;
    
    const { data: recentAttempts } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', rateLimitId)
      .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register attempt
    await supabaseAdmin.from('rate_limit_attempts').insert({
      identifier: rateLimitId,
      attempted_at: new Date().toISOString()
    });

    // PROCESSAMENTO: Verifica se usuário já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === email);

    if (userExists) {
      // Retorna mensagem neutra para não revelar existência
      return new Response(
        JSON.stringify({ 
          message: 'Verificação enviada se o e-mail for válido.' 
        }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cria usuário sem senha (pending)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // Não confirmar automaticamente
      user_metadata: { registration_source: 'manual_approval' }
    });

    if (createError) {
      console.error('Erro ao criar usuário');
      return new Response(
        JSON.stringify({ error: 'Erro ao processar cadastro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gera token de verificação opaco (one-time use)
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const { error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: newUser.user.id,
        token: verificationToken,
        token_type: 'email_verification',
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Erro ao criar token');
      // Rollback: deletar usuário criado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar cadastro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Enviar email com link de verificação
    console.log(`Token de verificação gerado para usuário`);
    console.log(`Link seria: /verify-email?token=${verificationToken}`);

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'registration_initiated',
      user_id: newUser.user.id,
      metadata: {},
      result: 'success'
    });

    // SAÍDA: Resposta neutra por segurança (SEM _dev_token)
    return new Response(
      JSON.stringify({ 
        message: 'Verificação enviada se o e-mail for válido.'
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /auth/register');
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
