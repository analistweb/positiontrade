import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Valid roles enum
const VALID_ROLES = ['pending', 'user', 'admin', 'moderator'] as const;
type ValidRole = typeof VALID_ROLES[number];

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /admin/users/:id/approve
 * Entrada: { user_id: string, assigned_roles?: string[] }
 * Processamento: Altera status para 'active', atribui roles iniciais (requer role admin)
 * Saída: 200 OK { userId, new_status: "active", assigned_roles }
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Rate limiting: 100 actions/hour per admin
    const rateLimitId = `admin-action:${admin.id}`;
    const { data: recentAttempts } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', rateLimitId)
      .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (recentAttempts && recentAttempts.length >= 100) {
      return new Response(
        JSON.stringify({ error: 'Limite de ações excedido. Aguarde 1 hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register attempt
    await supabaseAdmin.from('rate_limit_attempts').insert({
      identifier: rateLimitId,
      attempted_at: new Date().toISOString()
    });

    // ENTRADA: Validação do payload
    const body = await req.json();
    const user_id = typeof body?.user_id === 'string' ? body.user_id.trim() : '';
    const assigned_roles = Array.isArray(body?.assigned_roles) ? body.assigned_roles : ['user'];
    
    // Validate user_id format
    if (!user_id || !UUID_REGEX.test(user_id)) {
      return new Response(
        JSON.stringify({ error: 'ID de usuário inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate roles against enum
    const validatedRoles: ValidRole[] = [];
    for (const role of assigned_roles) {
      if (typeof role !== 'string') continue;
      const trimmedRole = role.trim().toLowerCase();
      if (VALID_ROLES.includes(trimmedRole as ValidRole)) {
        validatedRoles.push(trimmedRole as ValidRole);
      }
    }

    if (validatedRoles.length === 0) {
      validatedRoles.push('user'); // Default role
    }

    // PROCESSAMENTO: Altera status para 'active'
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ status: 'active' })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Erro ao atualizar perfil');
      return new Response(
        JSON.stringify({ error: 'Erro ao aprovar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atribui roles iniciais
    const rolesToInsert = validatedRoles.map(role => ({
      user_id,
      role
    }));

    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .upsert(rolesToInsert, { onConflict: 'user_id,role' });

    if (rolesError) {
      console.error('Erro ao atribuir roles');
    }

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'user_approved',
      user_id,
      actor_id: admin.id,
      metadata: { assigned_roles: validatedRoles },
      result: 'success'
    });

    // SAÍDA: Confirmação de aprovação
    return new Response(
      JSON.stringify({ 
        userId: user_id,
        new_status: 'active',
        assigned_roles: validatedRoles
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /admin/users/:id/approve');
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
