-- Portal do Cliente: sessao com token no lugar de leitura aberta para `anon`.
--
-- Problema: o portal do cliente nao usa o auth do Supabase (login pela edge
-- function client-login, sessao no localStorage), entao toda consulta chega no
-- banco como role `anon` - sem nenhuma identidade. A unica forma de o painel
-- enxergar dados era abrir a tabela para `anon`, o que significa abrir para
-- qualquer um com a chave publica do frontend (IDOR).
--
-- Aqui o login passa a criar uma sessao com token aleatorio (guardamos apenas o
-- hash SHA-256) e os dados do painel passam a ser servidos por funcoes
-- SECURITY DEFINER que resolvem o token -> client_id e devolvem SOMENTE as
-- linhas daquele cliente. Nenhuma politica nova de leitura para `anon`.

-- digest() vem do pgcrypto; no Supabase a extensao vive no schema `extensions`
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Sessoes do portal
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  -- Guardamos o hash, nunca o token: um dump do banco nao entrega sessoes ativas
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS client_sessions_token_hash_key
  ON public.client_sessions (token_hash);
CREATE INDEX IF NOT EXISTS client_sessions_client_id_idx
  ON public.client_sessions (client_id);
CREATE INDEX IF NOT EXISTS client_sessions_expires_at_idx
  ON public.client_sessions (expires_at);

-- RLS habilitado e SEM nenhuma policy: a tabela e inacessivel por `anon` e por
-- `authenticated`. So chegam nela a service_role (edge function) e as funcoes
-- SECURITY DEFINER abaixo.
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_sessions FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Funcoes internas (nao expostas ao cliente)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_portal_token_hash(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT CASE
    WHEN p_token IS NULL OR length(p_token) < 32 THEN NULL
    ELSE encode(digest(p_token, 'sha256'), 'hex')
  END;
$$;

-- Resolve o token para o client_id. Devolve NULL quando a sessao nao existe,
-- expirou, ou o acesso ao sistema do cliente foi desativado.
CREATE OR REPLACE FUNCTION public.client_portal_client_id(p_token text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT s.client_id
  FROM public.client_sessions s
  JOIN public.clients c ON c.id = s.client_id
  WHERE s.token_hash = public.client_portal_token_hash(p_token)
    AND s.token_hash IS NOT NULL
    AND s.expires_at > now()
    AND c.allow_system_access = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.client_portal_token_hash(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_portal_client_id(text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- RPC do painel: vendas do proprio cliente
-- ---------------------------------------------------------------------------

-- Devolve as vendas do cliente da sessao, com itens e produtos, no mesmo
-- formato que o painel ja consumia. O vinculo considera tanto `client_id` como
-- as vendas geradas a partir dos orcamentos do cliente - era justamente esse
-- segundo caminho que faltava e fazia o pedido desaparecer do painel.
CREATE OR REPLACE FUNCTION public.client_portal_sales(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_sales jsonb;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

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
        -- Datas de cada etapa, usadas na linha do tempo do painel
        'converted_from_budget_at', s.converted_from_budget_at,
        'separation_completed_at', s.separation_completed_at,
        'conference_completed_at', s.conference_completed_at,
        'invoice_completed_at', s.invoice_completed_at,
        'delivery_completed_at', s.delivery_completed_at,
        'clients', jsonb_build_object('name', c.name),
        'sale_items', COALESCE((
          SELECT jsonb_agg(
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
          )
          FROM public.sale_items si
          LEFT JOIN public.products p ON p.id = si.product_id
          WHERE si.sale_id = s.id
        ), '[]'::jsonb)
      ) AS sale
    FROM public.sales s
    JOIN public.clients c ON c.id = s.client_id
    WHERE s.client_id = v_client_id
       OR s.budget_id IN (
            SELECT b.id FROM public.budgets b WHERE b.client_id = v_client_id
          )
  ) q;

  RETURN jsonb_build_object('sales', v_sales);
END;
$$;

-- ---------------------------------------------------------------------------
-- Logout: encerra a sessao do portal
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_portal_logout(p_token text)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
BEGIN
  v_hash := public.client_portal_token_hash(p_token);

  IF v_hash IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.client_sessions WHERE token_hash = v_hash;
END;
$$;

-- Somente estas duas sao chamaveis pelo portal
REVOKE ALL ON FUNCTION public.client_portal_sales(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_portal_logout(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_portal_sales(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.client_portal_logout(text) TO anon, authenticated;
