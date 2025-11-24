-- Função para limpar movimentações órfãs de vendas deletadas
CREATE OR REPLACE FUNCTION clean_orphaned_stock_movements()
RETURNS TABLE (
  deleted_count integer,
  total_quantity numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_deleted_count integer;
  v_total_quantity numeric;
BEGIN
  -- Deletar movimentações de saída órfãs (vendas que não existem mais)
  WITH deleted_movements AS (
    DELETE FROM public.stock_movements sm
    WHERE sm.movement_type = 'saida' 
      AND sm.reason = 'venda'
      AND sm.reference_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.sales s WHERE s.id = sm.reference_id
      )
    RETURNING quantity
  )
  SELECT 
    COUNT(*)::integer,
    COALESCE(SUM(quantity), 0)
  INTO v_deleted_count, v_total_quantity
  FROM deleted_movements;
  
  RETURN QUERY SELECT v_deleted_count, v_total_quantity;
END;
$$;

-- Função para validar integridade de estoque
CREATE OR REPLACE FUNCTION validate_stock_integrity()
RETURNS TABLE (
  product_id uuid,
  product_code text,
  product_name text,
  system_stock numeric,
  calculated_stock numeric,
  difference numeric,
  total_entries numeric,
  total_exits numeric,
  orphaned_movements integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.internal_code,
    p.name,
    p.stock as system_stock,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN sm.movement_type = 'saida' THEN sm.quantity ELSE 0 END), 0) as calculated_stock,
    p.stock - (COALESCE(SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE 0 END), 0) - 
               COALESCE(SUM(CASE WHEN sm.movement_type = 'saida' THEN sm.quantity ELSE 0 END), 0)) as difference,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE 0 END), 0) as total_entries,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'saida' THEN sm.quantity ELSE 0 END), 0) as total_exits,
    (
      SELECT COUNT(*)::integer
      FROM public.stock_movements sm2
      WHERE sm2.product_id = p.id
        AND sm2.movement_type = 'saida'
        AND sm2.reason = 'venda'
        AND sm2.reference_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.sales s WHERE s.id = sm2.reference_id
        )
    ) as orphaned_movements
  FROM public.products p
  LEFT JOIN public.stock_movements sm ON sm.product_id = p.id
  GROUP BY p.id, p.internal_code, p.name, p.stock
  HAVING p.stock != (COALESCE(SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE 0 END), 0) - 
                     COALESCE(SUM(CASE WHEN sm.movement_type = 'saida' THEN sm.quantity ELSE 0 END), 0))
      OR (SELECT COUNT(*)::integer
          FROM public.stock_movements sm2
          WHERE sm2.product_id = p.id
            AND sm2.movement_type = 'saida'
            AND sm2.reason = 'venda'
            AND sm2.reference_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.sales s WHERE s.id = sm2.reference_id
            )) > 0
  ORDER BY ABS(p.stock - (COALESCE(SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE 0 END), 0) - 
                          COALESCE(SUM(CASE WHEN sm.movement_type = 'saida' THEN sm.quantity ELSE 0 END), 0))) DESC;
END;
$$;

COMMENT ON FUNCTION clean_orphaned_stock_movements IS 'Remove movimentações de estoque órfãs (vendas deletadas)';
COMMENT ON FUNCTION validate_stock_integrity IS 'Valida integridade do estoque comparando stock_movements com products.stock';