-- Atualizar a função get_sales_by_product_report para corrigir o cálculo do ticket médio
CREATE OR REPLACE FUNCTION public.get_sales_by_product_report(
  p_start_date timestamp with time zone, 
  p_end_date timestamp with time zone, 
  p_status text DEFAULT 'all'::text
)
RETURNS TABLE(
  internal_code text, 
  product_name text, 
  category_name text, 
  quantity_sold bigint, 
  total_value numeric, 
  average_ticket numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.internal_code,
    p.name as product_name,
    COALESCE(c.name, 'Sem categoria') as category_name,
    SUM(si.quantity)::bigint as quantity_sold,
    SUM(si.total_price) as total_value,
    SUM(si.total_price) / NULLIF(SUM(si.quantity), 0) as average_ticket
  FROM public.sale_items si
  INNER JOIN public.sales s ON s.id = si.sale_id
  INNER JOIN public.products p ON p.id = si.product_id
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE s.created_at >= p_start_date
    AND s.created_at <= p_end_date
    AND (p_status = 'all' OR s.status::text = p_status)
  GROUP BY p.id, p.internal_code, p.name, c.name
  ORDER BY total_value DESC;
END;
$function$;