import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * GET /admin/users?status=pending&page=1&limit=10
 * Entrada: query params { status?, page?, limit? }
 * Processamento: Lista usuários filtrados por status (requer role admin)
 * Saída: 200 OK { users: [...], total: number, page: number }
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

    // Verifica usuário autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica se usuário é admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ENTRADA: Parse de query params
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'pending';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // PROCESSAMENTO: Busca usuários filtrados
    const { data: profiles, error: profilesError, count } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, status, email_verified_at, created_at', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuários' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Busca dados de email dos usuários
    const userIds = profiles?.map(p => p.user_id) || [];
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const usersWithEmail = profiles?.map(profile => {
      const authUser = authUsers?.users?.find(u => u.id === profile.user_id);
      return {
        id: profile.user_id,
        email: authUser?.email || 'N/A',
        status: profile.status,
        email_verified_at: profile.email_verified_at,
        created_at: profile.created_at
      };
    }) || [];

    // Log de auditoria
    await supabaseAdmin.from('audit_events').insert({
      event_type: 'admin_list_users',
      actor_id: user.id,
      metadata: { status, page, limit },
      result: 'success'
    });

    // SAÍDA: Lista de usuários
    return new Response(
      JSON.stringify({ 
        users: usersWithEmail,
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em /admin/users:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
