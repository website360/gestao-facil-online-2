-- Corrigir função para definir search_path e evitar warning de segurança
DROP FUNCTION IF EXISTS get_top_selling_products(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION get_top_selling_products(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  internal_code TEXT,
  photo_url TEXT,
  current_stock INTEGER,
  quantity_sold BIGINT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.internal_code,
    p.photo_url,
    p.stock AS current_stock,
    SUM(si.quantity)::BIGINT AS quantity_sold
  FROM 
    products p
  INNER JOIN 
    sale_items si ON p.id = si.product_id
  INNER JOIN 
    sales s ON si.sale_id = s.id
  WHERE 
    (p_start_date IS NULL OR s.created_at >= p_start_date)
    AND (p_end_date IS NULL OR s.created_at <= p_end_date)
    AND s.status IN ('separacao', 'conferencia', 'nota_fiscal', 'aguardando_entrega', 'entrega_realizada', 'finalizada')
  GROUP BY 
    p.id, p.name, p.internal_code, p.photo_url, p.stock
  ORDER BY 
    quantity_sold DESC
  LIMIT 10;
END;
$$;