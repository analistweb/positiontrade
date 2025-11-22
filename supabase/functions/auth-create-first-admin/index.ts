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

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing admins:', checkError);
      throw new Error('Erro ao verificar admins existentes');
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Já existe um administrador no sistema. Esta função só pode criar o primeiro admin.' 
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

    console.log('Creating first admin user...');

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
      console.error('Error creating user:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado');
    }

    const userId = authData.user.id;
    console.log('User created with ID:', userId);

    // Update user profile to active
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        status: 'active',
        email_verified_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
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
      console.error('Error adding admin role:', roleError);
      throw new Error(`Erro ao adicionar role admin: ${roleError.message}`);
    }

    console.log('Admin role added');

    // Log audit event
    await supabaseAdmin
      .from('audit_events')
      .insert({
        event_type: 'admin_created',
        user_id: userId,
        metadata: {
          email: email,
          method: 'first_admin_setup_function'
        },
        result: 'success'
      });

    console.log('First admin created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          email: email,
          password: password,
          userId: userId
        },
        message: '✅ Primeiro administrador criado com sucesso! Guarde estas credenciais em local seguro.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in auth-create-first-admin:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
        details: error.toString()
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
