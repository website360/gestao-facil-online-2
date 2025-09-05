import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let step = 'init'
  let userId = 'unknown'
  
  try {
    step = 'parsing-body'
    const body = await req.json()
    userId = body.userId || 'missing'
    
    if (!body.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId', step, userId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    step = 'creating-client'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing env vars', step, userId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    step = 'getting-auth'
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No auth header', step, userId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    step = 'verifying-user'
    const token = authHeader.replace('Bearer ', '')
    const userResult = await supabase.auth.getUser(token)
    
    if (userResult.error || !userResult.data.user) {
      return new Response(
        JSON.stringify({ error: 'Auth failed', step, userId, authError: userResult.error?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    step = 'checking-profile'
    const profileResult = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userResult.data.user.id)
      .single()

    if (profileResult.error) {
      return new Response(
        JSON.stringify({ error: 'Profile error', step, userId, profileError: profileResult.error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!profileResult.data || !['admin', 'gerente'].includes(profileResult.data.role)) {
      return new Response(
        JSON.stringify({ error: 'No permission', step, userId, role: profileResult.data?.role }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    step = 'checking-dependencies'
    
    // Apenas gerentes têm restrições - admins podem deletar tudo
    if (profileResult.data.role === 'gerente') {
      // Verificar movimentações de estoque para gerentes
      const stockResult = await supabase
        .from('stock_movements')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (stockResult.data && stockResult.data.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Usuário possui movimentações de estoque e não pode ser excluído', step, userId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Verificar se gerente está tentando deletar admin
      const targetResult = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (targetResult.data?.role === 'admin') {
        return new Response(
          JSON.stringify({ error: 'Gerentes não podem excluir administradores', step, userId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    } else if (profileResult.data.role === 'admin') {
      // Admin pode deletar tudo - primeiro limpar dependências
      step = 'cleaning-dependencies'
      
      try {
        // Atualizar stock_movements para NULL onde user_id = userId
        await supabase
          .from('stock_movements')
          .update({ user_id: null })
          .eq('user_id', userId)
        
        // Atualizar sales - todos os campos que referenciam usuários
        await supabase
          .from('sales')
          .update({ created_by: null })
          .eq('created_by', userId)
          
        await supabase
          .from('sales')
          .update({ responsible_user_id: null })
          .eq('responsible_user_id', userId)
          
        await supabase
          .from('sales')
          .update({ separation_user_id: null })
          .eq('separation_user_id', userId)
          
        await supabase
          .from('sales')
          .update({ conference_user_id: null })
          .eq('conference_user_id', userId)
          
        await supabase
          .from('sales')
          .update({ invoice_user_id: null })
          .eq('invoice_user_id', userId)
        
        // Atualizar budgets
        await supabase
          .from('budgets')
          .update({ created_by: null })
          .eq('created_by', userId)
          
        await supabase
          .from('budgets')
          .update({ approved_by: null })
          .eq('approved_by', userId)

        // Atualizar sale_status_logs
        await supabase
          .from('sale_status_logs')
          .update({ user_id: null })
          .eq('user_id', userId)
          
      } catch (cleanError) {
        return new Response(
          JSON.stringify({ error: 'Cleanup failed', step, userId, cleanError: cleanError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    step = 'deleting-user'
    const deleteResult = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteResult.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Delete failed', 
          step, 
          userId, 
          deleteError: deleteResult.error.message,
          deleteCode: deleteResult.error.status,
          deleteDetails: JSON.stringify(deleteResult.error)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    step = 'success'
    return new Response(
      JSON.stringify({ success: true, message: 'Deleted', step, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Exception', 
        step, 
        userId, 
        message: error.message,
        stack: error.stack?.substring(0, 500)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})