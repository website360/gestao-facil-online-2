-- Portal do Cliente: desempenho da listagem de vendas.
--
-- Sintoma: a RPC client_portal_sales estourava o statement_timeout do papel
-- `anon` (erro 57014) para clientes com muitas vendas - um deles tem 398. Pelo
-- SQL Editor funcionava, porque o limite de tempo ali e muito maior.
--
-- Tres causas, corrigidas aqui:
--
-- 1. Faltavam indices em sales e sale_items. A tabela budgets ja tinha os seus
--    (20260831120000), mas as vendas nao - entao cada venda da lista disparava
--    uma varredura completa de sale_items.
-- 2. A RPC montava os ITENS de todas as vendas num unico JSON. O painel so
--    precisa dos itens da venda que o cliente abre, entao eles sairam da
--    listagem e ganharam uma RPC propria, sob demanda.
-- 3. O cadastro do cliente vinha repetido em cada venda. Agora vem uma vez so.
--
-- Tambem troquei o `OR` do filtro por uma UNION: com OR entre duas colunas o
-- Postgres tende a descartar os indices e varrer a tabela inteira.

-- ---------------------------------------------------------------------------
-- Indices
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sales_client_id
  ON public.sales (client_id);

CREATE INDEX IF NOT EXISTS idx_sales_budget_id
  ON public.sales (budget_id);

CREATE INDEX IF NOT EXISTS idx_sales_created_at
  ON public.sales (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
  ON public.sale_items (sale_id);

-- ---------------------------------------------------------------------------
-- Listagem de vendas do portal (sem itens)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_portal_sales(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_client jsonb;
  v_sales jsonb;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  -- Cadastro do cliente uma vez so (o PDF da venda precisa do endereco)
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'email', c.email,
    'phone', c.phone,
    'client_type', c.client_type,
    'cpf', c.cpf,
    'cnpj', c.cnpj,
    'razao_social', c.razao_social,
    'cep', c.cep,
    'street', c.street,
    'number', c.number,
    'complement', c.complement,
    'neighborhood', c.neighborhood,
    'city', c.city,
    'state', c.state
  )
  INTO v_client
  FROM public.clients c
  WHERE c.id = v_client_id;

  SELECT COALESCE(jsonb_agg(q.sale ORDER BY q.created_at DESC), '[]'::jsonb)
  INTO v_sales
  FROM (
    SELECT
      s.created_at AS created_at,
      jsonb_build_object(
        'id', s.id,
        'client_id', s.client_id,
        'budget_id', s.budget_id,
        'status', s.status,
        'created_at', s.created_at,
        'created_by', s.created_by,
        'updated_at', s.updated_at,
        'total_amount', s.total_amount,
        'notes', s.notes,
        'invoice_number', s.invoice_number,
        'tracking_code', s.tracking_code,
        'shipping_cost', s.shipping_cost,
        'shipping_option_id', s.shipping_option_id,
        'payment_method_id', s.payment_method_id,
        'payment_type_id', s.payment_type_id,
        'discount_percentage', s.discount_percentage,
        'invoice_percentage', s.invoice_percentage,
        'taxes_amount', s.taxes_amount,
        'installments', s.installments,
        'local_delivery_info', s.local_delivery_info,
        'total_volumes', s.total_volumes,
        'total_weight_kg', s.total_weight_kg,
        'converted_from_budget_at', s.converted_from_budget_at,
        'separation_completed_at', s.separation_completed_at,
        'conference_completed_at', s.conference_completed_at,
        'invoice_completed_at', s.invoice_completed_at,
        'delivery_completed_at', s.delivery_completed_at
      ) AS sale
    FROM public.sales s
    WHERE s.id IN (
      -- UNION em vez de OR: cada ramo usa o seu indice
      SELECT s1.id FROM public.sales s1
       WHERE s1.client_id = v_client_id
      UNION
      SELECT s2.id FROM public.sales s2
       JOIN public.budgets b ON b.id = s2.budget_id
       WHERE b.client_id = v_client_id
    )
    ORDER BY s.created_at DESC
    LIMIT 1000
  ) q;

  RETURN jsonb_build_object('client', v_client, 'sales', v_sales);
END;
$$;

-- ---------------------------------------------------------------------------
-- Itens de UMA venda, sob demanda (modal de acompanhamento e PDF)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_portal_sale_items(p_token text, p_sale_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_owns boolean;
  v_items jsonb;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  -- A venda precisa ser do cliente da sessao (direto ou via orcamento dele)
  SELECT EXISTS (
    SELECT 1
    FROM public.sales s
    LEFT JOIN public.budgets b ON b.id = s.budget_id
    WHERE s.id = p_sale_id
      AND (s.client_id = v_client_id OR b.client_id = v_client_id)
  ) INTO v_owns;

  IF NOT v_owns THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', si.id,
      'sale_id', si.sale_id,
      'product_id', si.product_id,
      'quantity', si.quantity,
      'unit_price', si.unit_price,
      'total_price', si.total_price,
      'discount_percentage', si.discount_percentage,
      'products', CASE
        WHEN p.id IS NULL THEN NULL
        ELSE jsonb_build_object(
          'name', p.name,
          'internal_code', p.internal_code,
          'price', p.price
        )
      END
    )
  ), '[]'::jsonb)
  INTO v_items
  FROM public.sale_items si
  LEFT JOIN public.products p ON p.id = si.product_id
  WHERE si.sale_id = p_sale_id;

  RETURN jsonb_build_object('items', v_items);
END;
$$;

REVOKE ALL ON FUNCTION public.client_portal_sale_items(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_portal_sale_items(text, uuid) TO anon, authenticated;

-- Avisa a API para recarregar o cache de schema (senao a funcao nova demora a
-- ficar visivel e o PostgREST responde PGRST202)
NOTIFY pgrst, 'reload schema';
