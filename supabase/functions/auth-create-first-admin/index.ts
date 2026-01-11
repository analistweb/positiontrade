import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Rate limiting: 1 attempt per hour per IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimitId = `first-admin:${clientIp}`;
    
    const { data: recentAttempts } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', rateLimitId)
      .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (recentAttempts && recentAttempts.length >= 1) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Aguarde 1 hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register attempt
    await supabaseAdmin.from('rate_limit_attempts').insert({
      identifier: rateLimitId,
      attempted_at: new Date().toISOString()
    });

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing admins:', checkError);
      throw new Error('Erro ao verificar administradores');
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Administrador já existe. Esta função só pode criar o primeiro admin.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate secure credentials
    const email = 'admin@cryptoanalytics.app';
    const password = generateSecurePassword();

    console.log('Checking if user already exists...');
    
    let userId: string;
    let isNewUser = false;

    // Try to get existing user first
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('User already exists, will promote to admin');
      userId = existingUser.id;
      
      // Update password for existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { 
          password: password,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('Error updating user password');
        throw new Error('Erro ao atualizar usuário');
      }

      console.log('Password updated for existing user');
    } else {
      console.log('Creating new admin user...');
      isNewUser = true;

      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          created_via: 'first_admin_setup'
        }
      });

      if (authError) {
        console.error('Error creating user');
        throw new Error('Erro ao criar usuário');
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      userId = authData.user.id;
      console.log('User created successfully');
    }

    // Update user profile to active
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        status: 'active',
        email_verified_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile');
      throw new Error('Erro ao atualizar perfil');
    }

    console.log('Profile updated to active');

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin'
      });

    if (roleError) {
      console.error('Error adding admin role');
      throw new Error('Erro ao adicionar role admin');
    }

    console.log('Admin role added');

    // Log audit event (without exposing email)
    await supabaseAdmin
      .from('audit_events')
      .insert({
        event_type: 'admin_created',
        user_id: userId,
        metadata: {
          method: 'first_admin_setup_function'
        },
        result: 'success'
      });

    console.log('First admin created successfully');

    // Return credentials with password (one-time display)
    // Note: This is necessary for initial setup but should be displayed only once in UI
    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          email: email,
          password: password,
          userId: userId
        },
        message: isNewUser 
          ? '✅ Primeiro administrador criado! Guarde estas credenciais em local seguro.'
          : '✅ Usuário promovido a administrador! Nova senha gerada.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in auth-create-first-admin');
    
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  return password;
}
