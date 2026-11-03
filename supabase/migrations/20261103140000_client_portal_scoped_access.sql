-- Portal do Cliente - fase 2: fechar o acesso `anon` aos dados por cliente.
--
-- A fase 1 (20261103130000) criou a sessao com token e passou as VENDAS do
-- painel para uma RPC escopada. Orcamentos, itens, o cadastro do proprio
-- cliente e as configuracoes do sistema continuavam sendo lidos/escritos
-- diretamente pela role `anon`, com politicas do tipo "qualquer cliente com
-- allow_system_access = true" - ou seja, qualquer pessoa com a chave publica do
-- frontend conseguia ler (e escrever) dados de todos os clientes do portal.
--
-- Aqui todas essas operacoes passam a exigir o token da sessao, e as politicas
-- `anon` correspondentes sao removidas.
--
-- O que CONTINUA aberto para `anon`, de proposito: products, categories,
-- payment_methods, payment_types e shipping_options. Sao dados de catalogo,
-- ja publicos pela rota /catalog do proprio site.
--
-- Nota sobre a divisao de responsabilidades nas escritas: o calculo dos totais
-- e a deduplicacao de itens continuam no JS (sao as mesmas regras usadas pelo
-- admin, em budgetService). A RPC e responsavel pela AUTORIZACAO: forca
-- client_id/created_by do dono da sessao, restringe os status que o cliente
-- pode gravar e so aceita as colunas da lista branca.

-- NOTA: esta fase NAO redefine client_portal_sales.
-- A versao valida e a de 20261103150000, otimizada depois que a listagem
-- estourou o statement_timeout para um cliente com 398 vendas (erro 57014).
-- Ela ja devolve o cadastro completo do cliente, que era o motivo pelo qual
-- esta fase redefinia a funcao. Recriar a versao antiga aqui reintroduziria
-- o timeout caso as migrations fossem aplicadas fora de ordem.

-- ---------------------------------------------------------------------------
-- Cadastro do proprio cliente
-- ---------------------------------------------------------------------------

-- O portal precisa dos proprios dados (endereco/CEP para o frete, documentos
-- para o PDF). Sem a senha de acesso, obviamente.
CREATE OR REPLACE FUNCTION public.client_portal_me(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_client jsonb;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'email', c.email,
    'phone', c.phone,
    'client_type', c.client_type,
    'cpf', c.cpf,
    'cnpj', c.cnpj,
    'razao_social', c.razao_social,
    'birth_date', c.birth_date,
    'cep', c.cep,
    'street', c.street,
    'number', c.number,
    'complement', c.complement,
    'neighborhood', c.neighborhood,
    'city', c.city,
    'state', c.state,
    'allow_system_access', c.allow_system_access
  )
  INTO v_client
  FROM public.clients c
  WHERE c.id = v_client_id;

  RETURN jsonb_build_object('client', v_client);
END;
$$;

-- ---------------------------------------------------------------------------
-- Orcamentos do portal: leitura
-- ---------------------------------------------------------------------------

-- Mesma regra de visibilidade da politica anon anterior: orcamentos criados
-- pelo proprio cliente (client_id = created_by). Rascunhos internos feitos pela
-- equipe para este cliente continuam fora do painel; quando viram venda, eles
-- aparecem pela RPC client_portal_sales.
CREATE OR REPLACE FUNCTION public.client_portal_budgets(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_budgets jsonb;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  SELECT COALESCE(jsonb_agg(q.budget ORDER BY q.created_at DESC), '[]'::jsonb)
  INTO v_budgets
  FROM (
    SELECT
      b.created_at AS created_at,
      jsonb_build_object(
        'id', b.id,
        'client_id', b.client_id,
        'notes', b.notes,
        'discount_percentage', b.discount_percentage,
        'invoice_percentage', b.invoice_percentage,
        'taxes_amount', b.taxes_amount,
        'payment_method_id', b.payment_method_id,
        'payment_type_id', b.payment_type_id,
        'shipping_option_id', b.shipping_option_id,
        'shipping_cost', b.shipping_cost,
        'local_delivery_info', b.local_delivery_info,
        'installments', b.installments,
        'check_installments', b.check_installments,
        'check_due_dates', b.check_due_dates,
        'boleto_installments', b.boleto_installments,
        'boleto_due_dates', b.boleto_due_dates,
        'status', b.status,
        'total_amount', b.total_amount,
        'created_at', b.created_at,
        'updated_at', b.updated_at,
        'created_by', b.created_by,
        'approved_at', b.approved_at,
        'stock_warnings', b.stock_warnings,
        -- O painel nao expoe quem atendeu internamente
        'creator_profile', NULL,
        'clients', jsonb_build_object(
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
        ),
        'budget_items', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', bi.id,
              'budget_id', bi.budget_id,
              'product_id', bi.product_id,
              'quantity', bi.quantity,
              'unit_price', bi.unit_price,
              'total_price', bi.total_price,
              'discount_percentage', bi.discount_percentage,
              'products', CASE
                WHEN p.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', p.id,
                  'name', p.name,
                  'internal_code', p.internal_code,
                  'price', p.price
                )
              END
            )
          )
          FROM public.budget_items bi
          LEFT JOIN public.products p ON p.id = bi.product_id
          WHERE bi.budget_id = b.id
            AND COALESCE(bi.quantity, 0) > 0
        ), '[]'::jsonb)
      ) AS budget
    FROM public.budgets b
    JOIN public.clients c ON c.id = b.client_id
    WHERE b.client_id = v_client_id
      AND b.created_by = v_client_id
  ) q;

  RETURN jsonb_build_object('budgets', v_budgets);
END;
$$;

-- ---------------------------------------------------------------------------
-- Orcamentos do portal: gravacao
-- ---------------------------------------------------------------------------

-- Status que o cliente pode gravar. Qualquer outro valor (aprovado,
-- convertido, rejeitado) e decisao da equipe interna.
CREATE OR REPLACE FUNCTION public.client_portal_allowed_status(p_status text)
RETURNS budget_status
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_status = 'aguardando_aprovacao' THEN 'aguardando_aprovacao'::budget_status
    ELSE 'processando'::budget_status
  END;
$$;

-- Cria ou atualiza um orcamento do cliente da sessao.
-- p_budget: colunas do orcamento (lista branca abaixo)
-- p_items : itens ja deduplicados pelo frontend
CREATE OR REPLACE FUNCTION public.client_portal_save_budget(
  p_token text,
  p_budget_id uuid,
  p_budget jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_budget_id uuid;
  v_current_status budget_status;
  v_status budget_status;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  v_status := public.client_portal_allowed_status(p_budget->>'status');

  IF p_budget_id IS NULL THEN
    INSERT INTO public.budgets (
      client_id, created_by, status, notes, total_amount,
      discount_percentage, invoice_percentage, taxes_amount,
      payment_method_id, payment_type_id, shipping_option_id,
      shipping_cost, local_delivery_info, installments,
      check_installments, check_due_dates,
      boleto_installments, boleto_due_dates
    )
    VALUES (
      v_client_id,
      v_client_id,
      v_status,
      p_budget->>'notes',
      COALESCE((p_budget->>'total_amount')::numeric, 0),
      (p_budget->>'discount_percentage')::numeric,
      (p_budget->>'invoice_percentage')::numeric,
      (p_budget->>'taxes_amount')::numeric,
      (p_budget->>'payment_method_id')::uuid,
      (p_budget->>'payment_type_id')::uuid,
      (p_budget->>'shipping_option_id')::uuid,
      COALESCE((p_budget->>'shipping_cost')::numeric, 0),
      p_budget->>'local_delivery_info',
      COALESCE((p_budget->>'installments')::integer, 1),
      COALESCE((p_budget->>'check_installments')::integer, 1),
      CASE
        WHEN jsonb_typeof(p_budget->'check_due_dates') = 'array'
        THEN ARRAY(SELECT value::integer FROM jsonb_array_elements_text(p_budget->'check_due_dates') AS t(value))
        ELSE NULL
      END,
      COALESCE((p_budget->>'boleto_installments')::integer, 1),
      CASE
        WHEN jsonb_typeof(p_budget->'boleto_due_dates') = 'array'
        THEN ARRAY(SELECT value::integer FROM jsonb_array_elements_text(p_budget->'boleto_due_dates') AS t(value))
        ELSE NULL
      END
    )
    RETURNING id INTO v_budget_id;
  ELSE
    -- Precisa ser um orcamento do proprio cliente e ainda editavel
    SELECT status INTO v_current_status
    FROM public.budgets
    WHERE id = p_budget_id
      AND client_id = v_client_id
      AND created_by = v_client_id;

    IF v_current_status IS NULL THEN
      RETURN jsonb_build_object('error', 'not_found');
    END IF;

    IF v_current_status NOT IN ('processando', 'rejeitado', 'aguardando_aprovacao') THEN
      RETURN jsonb_build_object('error', 'not_editable');
    END IF;

    -- Patch, nao substituicao: chave ausente no payload mantem o valor atual.
    -- O modal de edicao do cliente, por exemplo, envia apenas parte dos campos
    -- - sem isso o desconto e a nota fiscal do orcamento seriam zerados.
    UPDATE public.budgets SET
      status = v_status,
      notes = CASE WHEN p_budget ? 'notes' THEN p_budget->>'notes' ELSE notes END,
      total_amount = CASE WHEN p_budget ? 'total_amount'
        THEN COALESCE((p_budget->>'total_amount')::numeric, total_amount) ELSE total_amount END,
      discount_percentage = CASE WHEN p_budget ? 'discount_percentage'
        THEN (p_budget->>'discount_percentage')::numeric ELSE discount_percentage END,
      invoice_percentage = CASE WHEN p_budget ? 'invoice_percentage'
        THEN (p_budget->>'invoice_percentage')::numeric ELSE invoice_percentage END,
      taxes_amount = CASE WHEN p_budget ? 'taxes_amount'
        THEN (p_budget->>'taxes_amount')::numeric ELSE taxes_amount END,
      payment_method_id = CASE WHEN p_budget ? 'payment_method_id'
        THEN (p_budget->>'payment_method_id')::uuid ELSE payment_method_id END,
      payment_type_id = CASE WHEN p_budget ? 'payment_type_id'
        THEN (p_budget->>'payment_type_id')::uuid ELSE payment_type_id END,
      shipping_option_id = CASE WHEN p_budget ? 'shipping_option_id'
        THEN (p_budget->>'shipping_option_id')::uuid ELSE shipping_option_id END,
      shipping_cost = CASE WHEN p_budget ? 'shipping_cost'
        THEN COALESCE((p_budget->>'shipping_cost')::numeric, 0) ELSE shipping_cost END,
      local_delivery_info = CASE WHEN p_budget ? 'local_delivery_info'
        THEN p_budget->>'local_delivery_info' ELSE local_delivery_info END,
      installments = CASE WHEN p_budget ? 'installments'
        THEN COALESCE((p_budget->>'installments')::integer, 1) ELSE installments END,
      check_installments = CASE WHEN p_budget ? 'check_installments'
        THEN COALESCE((p_budget->>'check_installments')::integer, 1) ELSE check_installments END,
      check_due_dates = CASE
        WHEN jsonb_typeof(p_budget->'check_due_dates') = 'array'
        THEN ARRAY(SELECT value::integer FROM jsonb_array_elements_text(p_budget->'check_due_dates') AS t(value))
        ELSE check_due_dates
      END,
      boleto_installments = CASE WHEN p_budget ? 'boleto_installments'
        THEN COALESCE((p_budget->>'boleto_installments')::integer, 1) ELSE boleto_installments END,
      boleto_due_dates = CASE
        WHEN jsonb_typeof(p_budget->'boleto_due_dates') = 'array'
        THEN ARRAY(SELECT value::integer FROM jsonb_array_elements_text(p_budget->'boleto_due_dates') AS t(value))
        ELSE boleto_due_dates
      END,
      updated_at = now()
    WHERE id = p_budget_id;

    v_budget_id := p_budget_id;
  END IF;

  -- Itens: substituicao completa. Com a RPC o cliente finalmente pode apagar
  -- itens (antes nao havia policy de DELETE para anon, e o frontend precisava
  -- zerar a quantidade e fazer upsert).
  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
    DELETE FROM public.budget_items WHERE budget_id = v_budget_id;

    INSERT INTO public.budget_items (
      budget_id, product_id, quantity, unit_price, total_price, discount_percentage
    )
    SELECT DISTINCT ON (item.product_id)
      v_budget_id,
      item.product_id,
      -- budget_items.quantity e INTEGER no schema
      item.quantity::integer,
      item.unit_price,
      item.total_price,
      item.discount_percentage
    FROM (
      SELECT
        (value->>'product_id')::uuid AS product_id,
        COALESCE((value->>'quantity')::numeric, 0) AS quantity,
        COALESCE((value->>'unit_price')::numeric, 0) AS unit_price,
        COALESCE((value->>'total_price')::numeric, 0) AS total_price,
        COALESCE((value->>'discount_percentage')::numeric, 0) AS discount_percentage
      FROM jsonb_array_elements(p_items) AS t(value)
    ) item
    WHERE item.product_id IS NOT NULL
      AND item.quantity > 0
    ORDER BY item.product_id;
  END IF;

  RETURN jsonb_build_object('budget_id', v_budget_id);
END;
$$;

-- Enviar para aprovacao
CREATE OR REPLACE FUNCTION public.client_portal_submit_budget(p_token text, p_budget_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_updated uuid;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  -- 'aguardando_aprovacao' incluido para o reenvio ser idempotente: o modal de
  -- edicao do cliente oferece "Enviar para Aprovacao" tambem nesse estado.
  UPDATE public.budgets
  SET status = 'aguardando_aprovacao', updated_at = now()
  WHERE id = p_budget_id
    AND client_id = v_client_id
    AND created_by = v_client_id
    AND status IN ('processando', 'rejeitado', 'aguardando_aprovacao')
  RETURNING id INTO v_updated;

  IF v_updated IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object('budget_id', v_updated);
END;
$$;

-- Excluir orcamento (somente enquanto nao foi aprovado/convertido)
CREATE OR REPLACE FUNCTION public.client_portal_delete_budget(p_token text, p_budget_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_deleted uuid;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  DELETE FROM public.budget_items
  WHERE budget_id IN (
    SELECT id FROM public.budgets
    WHERE id = p_budget_id
      AND client_id = v_client_id
      AND created_by = v_client_id
      AND status IN ('processando', 'rejeitado', 'aguardando_aprovacao')
  );

  DELETE FROM public.budgets
  WHERE id = p_budget_id
    AND client_id = v_client_id
    AND created_by = v_client_id
    AND status IN ('processando', 'rejeitado', 'aguardando_aprovacao')
  RETURNING id INTO v_deleted;

  IF v_deleted IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object('budget_id', v_deleted);
END;
$$;

-- ---------------------------------------------------------------------------
-- Configuracoes liberadas para o portal (lista branca)
-- ---------------------------------------------------------------------------

-- system_configurations guarda credenciais (bling_config, correios_config).
-- A politica anterior tinha um ramo `EXISTS (SELECT 1 FROM clients WHERE
-- allow_system_access = true)` que, para `anon`, era verdadeiro para qualquer
-- requisicao - ou seja, as credenciais estavam legiveis com a chave publica.
-- Esta RPC entrega ao portal somente o que ele precisa: regra de desconto,
-- layout do PDF e se o frete dos Correios esta ativo (apenas o booleano).
CREATE OR REPLACE FUNCTION public.client_portal_config(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_id uuid;
  v_max_discount text;
  v_pdf_config text;
  v_correios text;
  v_correios_enabled boolean := false;
BEGIN
  v_client_id := public.client_portal_client_id(p_token);

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;

  SELECT value INTO v_max_discount
  FROM public.system_configurations WHERE key = 'max_discount_sales';

  SELECT value INTO v_pdf_config
  FROM public.system_configurations WHERE key = 'pdf_budget_config';

  SELECT value INTO v_correios
  FROM public.system_configurations WHERE key = 'correios_config';

  IF v_correios IS NOT NULL THEN
    BEGIN
      v_correios_enabled := COALESCE((v_correios::jsonb ->> 'enabled')::boolean, false);
    EXCEPTION WHEN others THEN
      v_correios_enabled := false;
    END;
  END IF;

  RETURN jsonb_build_object(
    'max_discount_sales', v_max_discount,
    'pdf_budget_config', v_pdf_config,
    'correios_enabled', v_correios_enabled
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Permissoes das RPCs
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.client_portal_me(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_portal_me(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.client_portal_budgets(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_portal_save_budget(text, uuid, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_portal_submit_budget(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_portal_delete_budget(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_portal_config(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_portal_allowed_status(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.client_portal_budgets(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.client_portal_save_budget(text, uuid, jsonb, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.client_portal_submit_budget(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.client_portal_delete_budget(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.client_portal_config(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Remocao das politicas abertas para `anon` / PUBLIC
-- ---------------------------------------------------------------------------

-- Orcamentos e itens: agora so pelas RPCs acima
DROP POLICY IF EXISTS "Anon clients can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Anon clients can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Anon clients can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Clients can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Clients can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Clients can create their own budgets" ON public.budgets;

DROP POLICY IF EXISTS "Anon clients can insert budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Anon clients can view their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Anon clients can update their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Clients can view their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Clients can create budget items" ON public.budget_items;

-- Vendas: atendidas por client_portal_sales desde a fase 1
DROP POLICY IF EXISTS "Clients can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Clients can view their own sale items" ON public.sale_items;

-- Cadastro do cliente: o portal usa os dados devolvidos no login
DROP POLICY IF EXISTS "Anon can view system-enabled clients" ON public.clients;

-- Configuracoes: fecha o ramo que valia para qualquer requisicao anon
DROP POLICY IF EXISTS "Users and clients can view system configurations" ON public.system_configurations;
CREATE POLICY "Staff can view system configurations"
ON public.system_configurations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY[
        'admin'::user_role, 'gerente'::user_role, 'vendas'::user_role,
        'vendedor_interno'::user_role, 'vendedor_externo'::user_role,
        'separacao'::user_role, 'conferencia'::user_role,
        'nota_fiscal'::user_role, 'entregador'::user_role
      ])
  )
);
