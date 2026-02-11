
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting create-user function')
    
    // Verificar se o usuário atual é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    // Verificar token do usuário atual
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Invalid token:', userError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Current user ID:', user.id)

    // Verificar se o usuário tem perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new Response(JSON.stringify({ error: 'Error checking permissions' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Current user profile:', profile)

    // Se não tem perfil, vamos criar um
    if (!profile) {
      console.log('User has no profile, creating one...')
      
      // Verificar se já existe algum admin no sistema
      const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      if (adminCheckError) {
        console.error('Error checking for existing admins:', adminCheckError)
        return new Response(JSON.stringify({ error: 'Error checking admin users' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Se não tem nenhum admin, fazer este usuário admin
      const roleToAssign = (!existingAdmins || existingAdmins.length === 0) ? 'admin' : 'vendas'
      
      console.log('Creating profile with role:', roleToAssign)

      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          role: roleToAssign
        })

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError)
        return new Response(JSON.stringify({ error: 'Error creating user profile' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Se criamos um perfil admin para este usuário, continuar
      if (roleToAssign === 'admin') {
        console.log('User profile created as admin, proceeding...')
      } else {
        console.log('User profile created but not as admin')
        return new Response(JSON.stringify({ error: 'Forbidden - Admin required' }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else if (profile.role !== 'admin') {
      console.error('User is not admin. Profile role:', profile.role)
      return new Response(JSON.stringify({ error: 'Forbidden - Admin required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { name, email, password, role } = requestData

    if (!name || !email || !password || !role) {
      console.error('Missing required fields:', { name: !!name, email: !!email, password: !!password, role: !!role })
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Creating user with data:', { name, email, role })

    // Criar usuário usando admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    })

    let userId: string | undefined

    if (createError) {
      // Se o email já existe, buscar o usuário existente e atualizar
      if (createError.message?.includes('already been registered')) {
        console.log('User already exists, looking up by email...')
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error('Error listing users:', listError)
          return new Response(JSON.stringify({ error: 'Erro ao buscar usuário existente' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const existingUser = existingUsers.users.find(u => u.email === email)
        if (!existingUser) {
          return new Response(JSON.stringify({ error: 'Usuário com este email já existe mas não foi encontrado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        userId = existingUser.id
        console.log('Found existing user:', userId)

        // Atualizar senha e metadata do usuário existente
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          user_metadata: { name }
        })
      } else {
        console.error('Error creating user:', createError)
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      userId = newUser.user?.id
      console.log('User created successfully:', userId)
    }

    // Atualizar o perfil do usuário com o role correto
    if (userId) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          name,
          email,
          role
        })

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError)
      } else {
        console.log('Profile updated successfully')
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: userId,
        email: email,
        name: name,
        role: role
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error in create-user function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
