import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Valida usuário admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Não autorizado" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (!profile || profile.role !== "admin") {
      return json({ error: "Apenas administradores" }, 403);
    }

    // Config do Bling
    const { data: configData } = await supabase
      .from("system_configurations")
      .select("value")
      .eq("key", "bling_config")
      .single();
    if (!configData) {
      return json({ error: "Configuração do Bling não encontrada" }, 400);
    }

    const blingConfig = JSON.parse(configData.value);
    const {
      client_id,
      client_secret,
      refresh_token,
      access_token: cachedAccessToken,
      access_token_expires_at,
    } = blingConfig;

    if (!client_id || !client_secret || !refresh_token) {
      return json({ error: "Credenciais do Bling incompletas. Autorize o aplicativo." }, 400);
    }

    let accessToken = cachedAccessToken;
    const tokenStillValid =
      cachedAccessToken && access_token_expires_at && Date.now() < access_token_expires_at - 300000;

    if (!tokenStillValid) {
      const basicAuth = btoa(`${client_id}:${client_secret}`);
      const tokenResponse = await fetch("https://api.bling.com.br/Api/v3/oauth/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refresh_token)}`,
      });
      const tokenBody = await tokenResponse.text();
      if (!tokenResponse.ok) {
        return json(
          { error: "Falha ao obter token do Bling. Reautorize o aplicativo.", details: tokenBody },
          502
        );
      }
      const tokenData = JSON.parse(tokenBody);
      accessToken = tokenData.access_token;
      await supabase
        .from("system_configurations")
        .update({
          value: JSON.stringify({
            ...blingConfig,
            refresh_token: tokenData.refresh_token,
            access_token: accessToken,
            access_token_expires_at: Date.now() + 21600 * 1000,
          }),
        })
        .eq("key", "bling_config");
    }

    // Busca as formas de pagamento no Bling
    const resp = await fetch("https://api.bling.com.br/Api/v3/formas-pagamentos", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const respBody = await resp.text();
    if (!resp.ok) {
      return json({ error: "Erro ao listar formas de pagamento do Bling", details: respBody }, 502);
    }

    const parsed = JSON.parse(respBody);
    const formas = (parsed?.data ?? []).map((f: any) => ({
      id: f.id,
      descricao: f.descricao ?? f.nome ?? `Forma ${f.id}`,
    }));

    return json({ success: true, formas });
  } catch (err) {
    console.error("bling-formas-pagamento error:", err);
    return json({ error: (err as Error).message ?? "Erro interno" }, 500);
  }
});
