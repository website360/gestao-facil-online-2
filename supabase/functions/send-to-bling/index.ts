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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem enviar para o Bling" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sale_id } = await req.json();
    if (!sale_id) {
      return new Response(JSON.stringify({ error: "sale_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already sent
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(`
        *,
        clients (name, cpf, cnpj, client_type, email, phone, street, number, complement, neighborhood, city, state, cep),
        sale_items (id, quantity, unit_price, total_price, discount_percentage, products (internal_code, name, stock_unit))
      `)
      .eq("id", sale_id)
      .single();

    if (saleError || !sale) {
      return new Response(JSON.stringify({ error: "Venda não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sale.bling_order_id) {
      return new Response(
        JSON.stringify({
          error: "Venda já enviada ao Bling",
          bling_order_id: sale.bling_order_id,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Bling config
    const { data: configData } = await supabase
      .from("system_configurations")
      .select("value")
      .eq("key", "bling_config")
      .single();

    if (!configData) {
      return new Response(
        JSON.stringify({ error: "Configuração do Bling não encontrada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blingConfig = JSON.parse(configData.value);
    if (!blingConfig.enabled) {
      return new Response(
        JSON.stringify({ error: "Integração Bling desativada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { client_id, client_secret, refresh_token, access_token: cachedAccessToken, access_token_expires_at } = blingConfig;
    if (!client_id || !client_secret || !refresh_token) {
      return new Response(
        JSON.stringify({ error: "Credenciais do Bling incompletas. Autorize o aplicativo nas configurações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = cachedAccessToken;
    let newRefreshToken: string | null = null;

    // Use cached token if still valid (with 5 min buffer)
    const tokenStillValid = cachedAccessToken && access_token_expires_at && Date.now() < (access_token_expires_at - 300000);

    if (!tokenStillValid) {
      // Exchange refresh_token for access_token
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
        console.error("Bling token error:", tokenBody);
        return new Response(
          JSON.stringify({
            error: "Falha ao obter token do Bling. Reautorize o aplicativo nas configurações.",
            details: tokenBody,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = JSON.parse(tokenBody);
      accessToken = tokenData.access_token;
      newRefreshToken = tokenData.refresh_token;
    }

    // Save new tokens back to config
    if (newRefreshToken) {
      const updatedConfig = {
        ...blingConfig,
        refresh_token: newRefreshToken,
        access_token: accessToken,
        access_token_expires_at: Date.now() + 21600 * 1000,
      };
      await supabase
        .from("system_configurations")
        .update({ value: JSON.stringify(updatedConfig) })
        .eq("key", "bling_config");
    }

    // Build Bling order payload
    const client = sale.clients;
    const isJuridica = client?.client_type === "juridica";
    const documento = isJuridica ? (client?.cnpj ?? "") : (client?.cpf ?? "");
    const docLimpo = documento.replace(/\D/g, "");

    // Search for existing contact in Bling by document number
    let blingContatoId: number | null = null;

    if (docLimpo) {
      const searchResponse = await fetch(
        `https://api.bling.com.br/Api/v3/contatos?pesquisa=${encodeURIComponent(docLimpo)}&limite=1`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const searchBody = await searchResponse.text();
      if (searchResponse.ok) {
        try {
          const searchData = JSON.parse(searchBody);
          if (searchData?.data?.length > 0) {
            blingContatoId = searchData.data[0].id;
            console.log("Found existing Bling contact:", blingContatoId);
          }
        } catch { /* ignore parse errors */ }
      }
    }

    // If contact not found, create it in Bling
    if (!blingContatoId) {
      const contatoPayload = {
        nome: client?.name ?? "Cliente",
        tipo: isJuridica ? "J" : "F",
        situacao: "A",
        numeroDocumento: docLimpo,
        contribuinte: isJuridica ? 1 : 9,
        telefone: (client?.phone ?? "").replace(/\D/g, "").replace(/^0+$/, "") || "",
        email: client?.email ?? "",
        endereco: {
          endereco: client?.street ?? "",
          numero: client?.number ?? "",
          complemento: client?.complement ?? "",
          bairro: client?.neighborhood ?? "",
          cep: (client?.cep ?? "").replace(/\D/g, ""),
          municipio: client?.city ?? "",
          uf: client?.state ?? "",
        },
      };

      console.log("Creating Bling contact:", JSON.stringify(contatoPayload, null, 2));

      const createResponse = await fetch(
        "https://api.bling.com.br/Api/v3/contatos",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contatoPayload),
        }
      );
      const createBody = await createResponse.text();
      console.log("Create contact response:", createResponse.status, createBody);

      if (!createResponse.ok) {
        return new Response(
          JSON.stringify({
            error: "Erro ao criar contato no Bling",
            details: createBody,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const createData = JSON.parse(createBody);
      blingContatoId = createData?.data?.id ?? null;
    }

    if (!blingContatoId) {
      return new Response(
        JSON.stringify({ error: "Não foi possível obter o ID do contato no Bling" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const itens = (sale.sale_items ?? []).map((item: any) => ({
      codigo: item.products?.internal_code ?? "",
      descricao: item.products?.name ?? "",
      unidade: item.products?.stock_unit ?? "UN",
      quantidade: item.quantity ?? 0,
      valor: item.unit_price ?? 0,
      desconto: {
        valor: item.discount_percentage
          ? (item.unit_price * item.quantity * item.discount_percentage) / 100
          : 0,
      },
    }));

    const totalProdutos = itens.reduce(
      (sum: number, item: any) => sum + item.quantidade * item.valor - (item.desconto?.valor ?? 0),
      0
    );

    const payload = {
      data: new Date(sale.created_at).toISOString().split("T")[0],
      contato: {
        id: blingContatoId,
      },
      itens,
      transporte: {
        frete: sale.shipping_cost ?? 0,
      },
      observacoes: sale.notes ?? "",
      totalProdutos,
    };

    console.log("Sending to Bling:", JSON.stringify(payload, null, 2));

    // Send order to Bling
    const blingResponse = await fetch(
      "https://api.bling.com.br/Api/v3/pedidos/vendas",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const blingBody = await blingResponse.text();

    if (!blingResponse.ok) {
      console.error("Bling API error:", blingBody);
      return new Response(
        JSON.stringify({
          error: "Erro ao enviar pedido ao Bling",
          details: blingBody,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blingResult = JSON.parse(blingBody);
    const blingOrderId = blingResult?.data?.id?.toString() ?? blingResult?.id?.toString() ?? null;

    // Save bling_order_id to sale
    if (blingOrderId) {
      await supabase
        .from("sales")
        .update({ bling_order_id: blingOrderId })
        .eq("id", sale_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bling_order_id: blingOrderId,
        message: "Pedido enviado ao Bling com sucesso!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-to-bling error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
