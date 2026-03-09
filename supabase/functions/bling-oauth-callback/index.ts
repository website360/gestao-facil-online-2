import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization code from query params (GET redirect) or body (POST)
    let code: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      code = url.searchParams.get("code");
    } else {
      const body = await req.json();
      code = body.code;
    }

    if (!code) {
      // If GET without code, return an HTML error page
      if (req.method === "GET") {
        return new Response(
          `<html><body><h2>Erro: código de autorização não recebido</h2><p>Feche esta janela e tente novamente.</p></body></html>`,
          { status: 400, headers: { "Content-Type": "text/html" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Código de autorização não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Bling config from database
    const { data: configData, error: configError } = await supabase
      .from("system_configurations")
      .select("value")
      .eq("key", "bling_config")
      .single();

    if (configError || !configData) {
      const errorMsg = "Configuração do Bling não encontrada. Configure Client ID e Client Secret primeiro.";
      if (req.method === "GET") {
        return new Response(
          `<html><body><h2>Erro</h2><p>${errorMsg}</p></body></html>`,
          { status: 400, headers: { "Content-Type": "text/html" } }
        );
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blingConfig = JSON.parse(configData.value);
    const { client_id, client_secret } = blingConfig;

    if (!client_id || !client_secret) {
      const errorMsg = "Client ID ou Client Secret não configurados.";
      if (req.method === "GET") {
        return new Response(
          `<html><body><h2>Erro</h2><p>${errorMsg}</p></body></html>`,
          { status: 400, headers: { "Content-Type": "text/html" } }
        );
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange authorization code for tokens
    const basicAuth = btoa(`${client_id}:${client_secret}`);
    const tokenResponse = await fetch("https://api.bling.com.br/Api/v3/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${encodeURIComponent(code)}`,
    });

    const tokenBody = await tokenResponse.text();
    console.log("Bling token response status:", tokenResponse.status);
    console.log("Bling token response:", tokenBody);

    if (!tokenResponse.ok) {
      const errorMsg = `Falha ao trocar código por token: ${tokenBody}`;
      if (req.method === "GET") {
        return new Response(
          `<html><body><h2>Erro na autorização</h2><p>${errorMsg}</p><p>Feche esta janela e tente novamente.</p></body></html>`,
          { status: 502, headers: { "Content-Type": "text/html" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Falha ao trocar código por token", details: tokenBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = JSON.parse(tokenBody);
    const { access_token, refresh_token, expires_in } = tokenData;

    // Save tokens to config
    const updatedConfig = {
      ...blingConfig,
      refresh_token: refresh_token,
      access_token: access_token,
      access_token_expires_at: Date.now() + (expires_in ?? 21600) * 1000,
      authorized: true,
      authorized_at: new Date().toISOString(),
    };

    await supabase
      .from("system_configurations")
      .update({ value: JSON.stringify(updatedConfig) })
      .eq("key", "bling_config");

    // For GET requests (redirect from Bling), return HTML success page
    if (req.method === "GET") {
      return new Response(
        `<html>
        <head><title>Bling Autorizado</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0fdf4;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #16a34a;">✅ Bling autorizado com sucesso!</h2>
            <p>Você pode fechar esta janela e voltar ao sistema.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'bling-oauth-success' }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </div>
        </body>
        </html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Bling autorizado com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("bling-oauth-callback error:", err);
    const errorMsg = (err as Error).message ?? "Erro interno";
    if (req.method === "GET") {
      return new Response(
        `<html><body><h2>Erro</h2><p>${errorMsg}</p></body></html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
