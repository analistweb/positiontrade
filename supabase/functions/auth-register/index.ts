import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { email } = await req.json();
    
    if (!email || !email.includes('@')) {
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
      console.error('Erro ao criar usuário:', createError);
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
      console.error('Erro ao criar token:', tokenError);
      // Rollback: deletar usuário criado
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar cadastro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Enviar email com link de verificação
    // const verificationLink = `${Deno.env.get('APP_URL')}/verify-email?token=${verificationToken}`;
    console.log(`Token de verificação gerado para ${email}: ${verificationToken}`);
    console.log(`Link seria: /verify-email?token=${verificationToken}`);

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'registration_initiated',
      user_id: newUser.user.id,
      metadata: { email },
      result: 'success'
    });

    // SAÍDA: Resposta neutra por segurança
    return new Response(
      JSON.stringify({ 
        message: 'Verificação enviada se o e-mail for válido.',
        // Para desenvolvimento, inclui o token (remover em produção!)
        _dev_token: verificationToken
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /auth/register:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
