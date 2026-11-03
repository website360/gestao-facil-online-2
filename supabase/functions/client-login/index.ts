import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Duracao da sessao do portal do cliente
const SESSION_DAYS = 30

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

// Token aleatorio de 256 bits entregue ao navegador
const generateToken = () => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

// No banco guardamos apenas o hash do token
const hashToken = async (token: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return toHex(new Uint8Array(digest))
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Query clients table directly with service role
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .eq('system_password', password)
      .eq('allow_system_access', true)
      .single()

    if (error || !client) {
      return new Response(
        JSON.stringify({ error: 'Email ou senha incorretos' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Criar a sessao do portal: o navegador recebe o token, o banco so o hash.
    // E o token que identifica o cliente nas consultas do painel (RPCs
    // client_portal_*), em vez de abrir as tabelas para a role anon.
    const token = generateToken()
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Aproveita para limpar sessoes vencidas deste cliente
    await supabase
      .from('client_sessions')
      .delete()
      .eq('client_id', client.id)
      .lt('expires_at', new Date().toISOString())

    const { error: sessionError } = await supabase
      .from('client_sessions')
      .insert({
        client_id: client.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })

    // Se a sessao nao pode ser criada (ex.: migration client_sessions ainda nao
    // aplicada), o login nao quebra: devolvemos o cliente SEM token e o painel
    // cai no caminho antigo de consulta. O erro fica no log para investigacao.
    if (sessionError) {
      console.error('Error creating client session (fallback sem token):', sessionError)
    }

    // A senha nunca volta para o navegador (antes ia junto e ficava no
    // localStorage do cliente em texto puro)
    const { system_password: _omitted, ...safeClient } = client

    return new Response(
      JSON.stringify({
        client: safeClient,
        token: sessionError ? null : token,
        expires_at: sessionError ? null : expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in client login:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
