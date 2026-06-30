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

// Formata uma data (Date) como YYYY-MM-DD
const toYMD = (d: Date) => d.toISOString().split("T")[0];

// Soma "days" dias a uma data base e devolve YYYY-MM-DD
const addDays = (base: Date, days: number) => {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + (days || 0));
  return toYMD(d);
};

// Arredonda para 2 casas
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Monta o array de parcelas para o pedido do Bling a partir dos campos de
 * pagamento da venda. Retorna [] quando não há informação suficiente ou
 * quando não há forma de pagamento mapeada (nesse caso o pedido é enviado
 * sem parcelas, sem travar o envio).
 */
function buildParcelas(sale: any, blingFormaId: number | null, total: number) {
  if (!total || total <= 0) return [];

  const saleDate = new Date(sale.created_at ?? Date.now());

  // Define os "dias para vencimento" de cada parcela conforme o tipo de pagamento
  let dueDays: number[] = [];

  if (Array.isArray(sale.boleto_due_dates) && sale.boleto_due_dates.length > 0) {
    dueDays = sale.boleto_due_dates.map((d: any) => Number(d) || 0);
  } else if (Array.isArray(sale.check_due_dates) && sale.check_due_dates.length > 0) {
    dueDays = sale.check_due_dates.map((d: any) => Number(d) || 0);
  } else {
    const installments = Number(
      sale.installments ?? sale.boleto_installments ?? sale.check_installments ?? 1
    );
    if (installments > 1) {
      // Parcelas mensais (30, 60, 90...) quando não há datas específicas
      dueDays = Array.from({ length: installments }, (_, i) => (i + 1) * 30);
    } else {
      dueDays = [0]; // à vista
    }
  }

  const count = dueDays.length;
  if (count === 0) return [];

  // Sem forma de pagamento mapeada não enviamos parcelas (evita rejeição do Bling)
  if (!blingFormaId) return [];

  const base = round2(total / count);
  const parcelas = dueDays.map((days, i) => {
    const valor = i === count - 1 ? round2(total - base * (count - 1)) : base;
    return {
      dataVencimento: addDays(saleDate, days),
      valor,
      observacoes: `Parcela ${i + 1}/${count}`,
      formaPagamento: { id: blingFormaId },
    };
  });

  return parcelas;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Variáveis usadas também no registro de log/erro
  let saleId: string | null = null;
  let userId: string | null = null;
  let isDryRun = false;
  let requestPayload: unknown = null;

  // Helper para gravar no log de envios (best-effort, não derruba o fluxo)
  const writeLog = async (entry: {
    success: boolean;
    bling_order_id?: string | null;
    bling_order_number?: string | null;
    error_message?: string | null;
    response_payload?: unknown;
  }) => {
    try {
      await supabase.from("bling_sync_logs").insert({
        sale_id: saleId,
        success: entry.success,
        dry_run: isDryRun,
        bling_order_id: entry.bling_order_id ?? null,
        bling_order_number: entry.bling_order_number ?? null,
        error_message: entry.error_message ?? null,
        request_payload: requestPayload ?? null,
        response_payload: entry.response_payload ?? null,
        created_by: userId,
      });
    } catch (e) {
      console.error("Falha ao gravar bling_sync_logs:", e);
    }
  };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado" }, 401);
    }

    // Validate user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Não autorizado" }, 401);
    }

    userId = claimsData.claims.sub as string;

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "nota_fiscal")) {
      return json({ error: "Sem permissão para enviar para o Bling" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    saleId = body.sale_id ?? null;
    const dryRunRequested = body.dry_run === true;
    if (!saleId) {
      return json({ error: "sale_id é obrigatório" }, 400);
    }

    // Carrega a venda com itens, cliente e campos de pagamento
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(`
        *,
        clients (name, cpf, cnpj, client_type, email, phone, street, number, complement, neighborhood, city, state, cep),
        sale_items (id, quantity, unit_price, total_price, discount_percentage, products (internal_code, name, stock_unit))
      `)
      .eq("id", saleId)
      .single();

    if (saleError || !sale) {
      return json({ error: "Venda não encontrada" }, 404);
    }

    if (sale.bling_order_id) {
      return json(
        { error: "Venda já enviada ao Bling", bling_order_id: sale.bling_order_id },
        409
      );
    }

    // Get Bling config
    const { data: configData } = await supabase
      .from("system_configurations")
      .select("value")
      .eq("key", "bling_config")
      .single();

    if (!configData) {
      return json({ error: "Configuração do Bling não encontrada" }, 400);
    }

    const blingConfig = JSON.parse(configData.value);
    if (!blingConfig.enabled) {
      return json({ error: "Integração Bling desativada" }, 400);
    }

    // Dry-run pode vir do request ou estar ligado globalmente na config
    isDryRun = dryRunRequested || blingConfig.dry_run === true;

    const {
      client_id,
      client_secret,
      refresh_token,
      access_token: cachedAccessToken,
      access_token_expires_at,
      payment_method_map,
      default_forma_pagamento_id,
    } = blingConfig;

    if (!client_id || !client_secret || !refresh_token) {
      return json(
        { error: "Credenciais do Bling incompletas. Autorize o aplicativo nas configurações." },
        400
      );
    }

    let accessToken = cachedAccessToken;
    let newRefreshToken: string | null = null;

    // Use cached token if still valid (with 5 min buffer)
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
        console.error("Bling token error:", tokenBody);
        await writeLog({ success: false, error_message: `Falha no token: ${tokenBody}` });
        return json(
          {
            error: "Falha ao obter token do Bling. Reautorize o aplicativo nas configurações.",
            details: tokenBody,
          },
          502
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

    // ---- Contato ----
    const client = sale.clients;
    const isJuridica = client?.client_type === "juridica";
    const documento = isJuridica ? client?.cnpj ?? "" : client?.cpf ?? "";
    const docLimpo = documento.replace(/\D/g, "");

    let blingContatoId: number | null = null;

    if (docLimpo) {
      const searchResponse = await fetch(
        `https://api.bling.com.br/Api/v3/contatos?pesquisa=${encodeURIComponent(docLimpo)}&limite=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const searchBody = await searchResponse.text();
      if (searchResponse.ok) {
        try {
          const searchData = JSON.parse(searchBody);
          if (searchData?.data?.length > 0) {
            blingContatoId = searchData.data[0].id;
          }
        } catch { /* ignore */ }
      }
    }

    // Payload do contato (usado APENAS para criar um contato novo).
    // Na API v3 do Bling o endereço do contato fica aninhado em endereco.geral.
    const contatoPayload = {
      nome: client?.name ?? "Cliente",
      tipo: isJuridica ? "J" : "F",
      situacao: "A",
      numeroDocumento: docLimpo,
      contribuinte: isJuridica ? 1 : 9,
      telefone: (client?.phone ?? "").replace(/\D/g, "").replace(/^0+$/, "") || "",
      email: client?.email ?? "",
      endereco: {
        geral: {
          endereco: client?.street ?? "",
          numero: client?.number ?? "",
          complemento: client?.complement ?? "",
          bairro: client?.neighborhood ?? "",
          cep: (client?.cep ?? "").replace(/\D/g, ""),
          municipio: client?.city ?? "",
          uf: client?.state ?? "",
        },
      },
    };

    // Se o contato JÁ EXISTE no Bling, apenas o referenciamos pelo id —
    // NUNCA sobrescrevemos (igual aos produtos). O update sobrescrevia o
    // cadastro do Bling com os dados do nosso sistema e apagava campos que
    // só existem lá (ex.: Inscrição Estadual). Só criamos quando não existe.
    if (!isDryRun && !blingContatoId) {
      // Contato não existe: cria
      const createResponse = await fetch("https://api.bling.com.br/Api/v3/contatos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contatoPayload),
      });
      const createBody = await createResponse.text();

      if (!createResponse.ok) {
        await writeLog({ success: false, error_message: `Erro ao criar contato: ${createBody}` });
        return json({ error: "Erro ao criar contato no Bling", details: createBody }, 502);
      }

      const createData = JSON.parse(createBody);
      blingContatoId = createData?.data?.id ?? null;
    }

    if (!blingContatoId && !isDryRun) {
      await writeLog({ success: false, error_message: "Não foi possível obter o ID do contato no Bling" });
      return json({ error: "Não foi possível obter o ID do contato no Bling" }, 400);
    }

    // ---- Resolve o produto.id no Bling (por código) ----
    // O Bling só "reconhece"/vincula o item ao produto cadastrado quando o
    // item carrega produto.id. Enviar apenas o código cria um item avulso
    // (não vinculado), por isso buscamos o id de cada produto pelo código.
    const uniqueCodes = Array.from(
      new Set(
        (sale.sale_items ?? [])
          .map((it: any) => (it.products?.internal_code ?? "").toString().trim())
          .filter((c: string) => c.length > 0)
      )
    ) as string[];

    const codeToBlingProductId = new Map<string, number>();
    const produtosNaoEncontrados: string[] = [];
    // Guarda o motivo real caso a BUSCA de produtos falhe (ex.: app sem
    // permissão de Produtos -> 403). Isso fica visível no log/resposta.
    let lookupError: string | null = null;

    // Bling v3: o filtro por código no GET /produtos é "codigo" (SINGULAR,
    // um código por requisição). O parâmetro "codigos" (plural) é IGNORADO
    // pela API e retorna a lista inteira — verificado direto na API em
    // 2026-06-30. Por isso buscamos um código por vez.
    for (const code of uniqueCodes) {
      try {
        const resp = await fetch(
          `https://api.bling.com.br/Api/v3/produtos?codigo=${encodeURIComponent(code)}&limite=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!resp.ok) {
          const errBody = await resp.text();
          console.error(`Falha ao buscar produto ${code}:`, errBody);
          if (!lookupError) {
            lookupError = `GET /produtos retornou ${resp.status}: ${errBody.slice(0, 300)}`;
          }
          continue;
        }
        const data = await resp.json().catch(() => null);
        const list: any[] = Array.isArray(data?.data) ? data.data : [];
        // Match exato do código (a API pode trazer variações/parciais)
        const found = list.find((p) => (p.codigo ?? "").toString().trim() === code) ?? null;
        if (found?.id) {
          codeToBlingProductId.set(code, Number(found.id));
        }
      } catch (e) {
        console.error(`Erro ao buscar produto ${code}:`, e);
        if (!lookupError) lookupError = `Erro de rede ao buscar produtos: ${(e as Error).message}`;
      }
    }

    // Códigos do pedido que não retornaram um id no Bling
    for (const code of uniqueCodes) {
      if (!codeToBlingProductId.has(code)) produtosNaoEncontrados.push(code);
    }

    if (produtosNaoEncontrados.length > 0) {
      console.warn("Produtos não encontrados no Bling (por código):", produtosNaoEncontrados);
    }

    // Mensagem de diagnóstico legível, anexada ao log mesmo quando o envio
    // "tem sucesso" mas os itens foram como avulso (não vinculados).
    const buildVinculoNote = (vinculados: number, total: number): string | null => {
      if (produtosNaoEncontrados.length === 0) return null;
      const partes = [
        `Itens vinculados ao cadastro do Bling: ${vinculados}/${total}.`,
        `Não localizados pelo código: ${produtosNaoEncontrados.join(", ")}.`,
      ];
      if (lookupError) {
        partes.push(
          `A busca de produtos no Bling falhou (${lookupError}). ` +
            `Verifique se o aplicativo autorizado tem permissão de "Produtos".`
        );
      } else {
        partes.push(
          `Confirme no Bling se esses produtos têm exatamente esse Código (SKU).`
        );
      }
      return partes.join(" ");
    };

    // ---- Itens ----
    // O valor enviado por item é o "valor de Nota Fiscal":
    //   preço unitário × (1 − desconto%) × (% Nota Fiscal)
    // O desconto é embutido no preço (o Bling não aplica desconto por item aqui),
    // e o percentual de nota fiscal é aplicado sobre o valor líquido.
    // (Sem informação de % nota fiscal, considera 100%.)
    const invoicePct = sale.invoice_percentage == null ? 100 : Number(sale.invoice_percentage);
    const invoiceRatio = invoicePct / 100;
    const itens = (sale.sale_items ?? []).map((item: any) => {
      const unit = Number(item.unit_price ?? 0);
      const pct = Number(item.discount_percentage ?? 0);
      const netUnit = pct ? unit * (1 - pct / 100) : unit;
      const valor = round2(netUnit * invoiceRatio);
      const codigo = (item.products?.internal_code ?? "").toString().trim();
      const blingProdutoId = codeToBlingProductId.get(codigo) ?? null;
      return {
        // produto.id vincula o item ao cadastro do Bling (item "reconhecido")
        ...(blingProdutoId ? { produto: { id: blingProdutoId } } : {}),
        codigo,
        descricao: item.products?.name ?? "",
        unidade: item.products?.stock_unit ?? "UN",
        quantidade: item.quantity ?? 0,
        valor,
      };
    });

    const itensVinculados = itens.filter((it: any) => it.produto?.id).length;
    const vinculoNote = buildVinculoNote(itensVinculados, itens.length);

    const totalProdutos = round2(
      itens.reduce((sum: number, item: any) => sum + item.quantidade * item.valor, 0)
    );

    // Total que o Bling calcula a partir do payload (produtos + frete).
    // As parcelas DEVEM somar exatamente este valor, senão o Bling recusa.
    const frete = round2(Number(sale.shipping_cost ?? 0));
    const orderTotal = round2(totalProdutos + frete);

    // ---- Forma de pagamento / parcelas ----
    let blingFormaId =
      (payment_method_map && sale.payment_method_id
        ? Number(payment_method_map[sale.payment_method_id])
        : null) ||
      (default_forma_pagamento_id ? Number(default_forma_pagamento_id) : null) ||
      null;

    // Valida a forma de pagamento contra as formas reais do Bling. Um id
    // mapeado que não existe mais (ex.: formas recriadas no Bling) faz o
    // pedido INTEIRO ser rejeitado com "Id da forma de pagamento inválido".
    // Se confirmarmos que o id é inválido, enviamos SEM parcelas (o pedido
    // entra; o financeiro pode ser ajustado no Bling) e avisamos no log.
    let formaPagamentoNote: string | null = null;
    if (blingFormaId) {
      try {
        const fpResp = await fetch(
          "https://api.bling.com.br/Api/v3/formas-pagamentos?limite=100",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (fpResp.ok) {
          const fpData = await fpResp.json().catch(() => null);
          const validIds = new Set(
            (Array.isArray(fpData?.data) ? fpData.data : [])
              .map((f: any) => Number(f.id))
              .filter((n: number) => Number.isFinite(n))
          );
          // Só descarta se a lista veio e o id realmente não está nela
          if (validIds.size > 0 && !validIds.has(blingFormaId)) {
            formaPagamentoNote =
              `A forma de pagamento mapeada (id ${blingFormaId}) não existe mais no Bling. ` +
              `Pedido enviado SEM parcelas — remapeie a forma em Configurações → Bling.`;
            console.warn(formaPagamentoNote);
            blingFormaId = null; // evita rejeição do pedido inteiro
          }
        } else {
          // Falha ao listar formas: não arriscamos descartar uma forma válida
          console.error("Falha ao validar formas de pagamento:", await fpResp.text());
        }
      } catch (e) {
        console.error("Erro ao validar formas de pagamento:", e);
      }
    }

    const parcelas = buildParcelas(sale, blingFormaId, orderTotal);

    // Diagnóstico combinado (vínculo de produtos + forma de pagamento)
    const diagNote = [vinculoNote, formaPagamentoNote].filter(Boolean).join(" ") || null;

    // ---- Volumes e peso bruto (preenchidos na conferência) ----
    // Bling: transporte.quantidadeVolumes (Quantidade) e transporte.pesoBruto
    // (Peso Bruto). total_volumes/total_weight_kg vêm da venda.
    const quantidadeVolumes =
      Number(sale.total_volumes) > 0 ? Math.round(Number(sale.total_volumes)) : 1;
    const pesoBruto = Math.max(
      0,
      Math.round(Number(sale.total_weight_kg ?? 0) * 1000) / 1000
    );

    // ---- Loja e categoria (padrão fixo da empresa) ----
    // Valores constantes confirmados na conta do Bling (canais-venda / pedido):
    //   Loja "Inhapim 40" = 204694809 | Categoria "Venda de mercadoria" = 14619596706
    const LOJA_ID = 204694809;
    const CATEGORIA_ID = 14619596706;

    // ---- Payload do pedido ----
    const payload: Record<string, unknown> = {
      data: toYMD(new Date(sale.created_at)),
      contato: { id: blingContatoId },
      loja: { id: LOJA_ID },
      categoria: { id: CATEGORIA_ID },
      itens,
      transporte: { frete, quantidadeVolumes, pesoBruto },
      observacoes: sale.notes ?? "",
      totalProdutos,
    };
    if (parcelas.length > 0) {
      payload.parcelas = parcelas;
    }

    requestPayload = payload;
    console.log("Bling payload:", JSON.stringify(payload, null, 2));

    // ---- Dry-run: não envia, apenas registra ----
    if (isDryRun) {
      await writeLog({
        success: true,
        error_message: diagNote,
        response_payload: {
          dry_run: true,
          note: "Pedido NÃO enviado (dry-run)",
          itens_vinculados: itensVinculados,
          itens_total: itens.length,
          produtos_nao_encontrados: produtosNaoEncontrados,
          lookup_error: lookupError,
          forma_pagamento_note: formaPagamentoNote,
          payload,
        },
      });
      return json({
        success: true,
        dry_run: true,
        message:
          `Dry-run: pedido montado (itens vinculados: ${itensVinculados}/${itens.length}), NÃO enviado.` +
          (diagNote ? ` ${diagNote}` : ""),
        parcelas_count: parcelas.length,
        forma_pagamento_id: blingFormaId,
        itens_vinculados: itensVinculados,
        itens_total: itens.length,
        produtos_nao_encontrados: produtosNaoEncontrados,
        lookup_error: lookupError,
        forma_pagamento_note: formaPagamentoNote,
        payload,
      });
    }

    // ---- Envio real ----
    const blingResponse = await fetch("https://api.bling.com.br/Api/v3/pedidos/vendas", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const blingBody = await blingResponse.text();
    let blingResult: any = null;
    try { blingResult = JSON.parse(blingBody); } catch { /* keep raw */ }

    if (!blingResponse.ok) {
      console.error("Bling API error:", blingBody);
      await supabase
        .from("sales")
        .update({ bling_last_error: blingBody.slice(0, 2000) })
        .eq("id", saleId);
      await writeLog({
        success: false,
        error_message: blingBody.slice(0, 2000),
        response_payload: blingResult ?? blingBody,
      });
      return json({ error: "Erro ao enviar pedido ao Bling", details: blingBody }, 502);
    }

    const blingOrderId = blingResult?.data?.id?.toString() ?? blingResult?.id?.toString() ?? null;
    const blingOrderNumber =
      blingResult?.data?.numero?.toString() ?? blingResult?.numero?.toString() ?? null;
    const blingSituacao =
      blingResult?.data?.situacao?.valor?.toString() ??
      blingResult?.data?.situacao?.id?.toString() ??
      null;

    // Grava retorno na venda
    await supabase
      .from("sales")
      .update({
        bling_order_id: blingOrderId,
        bling_order_number: blingOrderNumber,
        bling_status: blingSituacao,
        bling_sent_at: new Date().toISOString(),
        bling_last_error: null,
      })
      .eq("id", saleId);

    await writeLog({
      success: true,
      bling_order_id: blingOrderId,
      bling_order_number: blingOrderNumber,
      // Mesmo com sucesso, registra se itens foram avulso ou se a forma caiu
      error_message: diagNote,
      response_payload: {
        itens_vinculados: itensVinculados,
        itens_total: itens.length,
        produtos_nao_encontrados: produtosNaoEncontrados,
        lookup_error: lookupError,
        forma_pagamento_note: formaPagamentoNote,
        bling: blingResult ?? blingBody,
      },
    });

    return json({
      success: true,
      bling_order_id: blingOrderId,
      bling_order_number: blingOrderNumber,
      itens_vinculados: itensVinculados,
      itens_total: itens.length,
      produtos_nao_encontrados: produtosNaoEncontrados,
      lookup_error: lookupError,
      forma_pagamento_note: formaPagamentoNote,
      message:
        diagNote
          ? `Pedido enviado (itens vinculados: ${itensVinculados}/${itens.length}). ${diagNote}`
          : `Pedido enviado ao Bling com sucesso! (${itensVinculados}/${itens.length} itens vinculados)`,
    });
  } catch (err) {
    console.error("send-to-bling error:", err);
    const msg = (err as Error).message ?? "Erro interno";
    await writeLog({ success: false, error_message: msg });
    return json({ error: msg }, 500);
  }
});
