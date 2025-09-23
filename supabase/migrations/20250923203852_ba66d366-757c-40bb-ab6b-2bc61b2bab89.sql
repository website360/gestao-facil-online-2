-- Deduplicate budget_items and enforce uniqueness per (budget_id, product_id)
DO $$
BEGIN
  -- 1) Aggregate duplicates into a single survivor row per (budget_id, product_id)
  WITH agg AS (
    SELECT 
      budget_id,
      product_id,
      SUM(quantity)::integer AS qty_sum,
      MAX(unit_price) AS unit_price,
      COALESCE(MAX(discount_percentage), 0) AS discount_percentage,
      SUM(total_price) AS total_sum
    FROM public.budget_items
    GROUP BY budget_id, product_id
  ), survivors AS (
    SELECT DISTINCT ON (budget_id, product_id)
      id, budget_id, product_id
    FROM public.budget_items
    ORDER BY budget_id, product_id, created_at ASC, id ASC
  )
  UPDATE public.budget_items b
  SET 
    quantity = a.qty_sum,
    unit_price = a.unit_price,
    discount_percentage = a.discount_percentage,
    total_price = a.total_sum
  FROM agg a
  JOIN survivors s
    ON s.budget_id = a.budget_id AND s.product_id = a.product_id
  WHERE b.id = s.id;

  -- 2) Delete remaining duplicates, keeping only the first row per key
  DELETE FROM public.budget_items b
  USING (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY budget_id, product_id ORDER BY created_at ASC, id ASC) AS rn
      FROM public.budget_items
    ) t
    WHERE t.rn > 1
  ) d
  WHERE b.id = d.id;

  -- 3) Add unique constraint to prevent future duplicates
  BEGIN
    ALTER TABLE public.budget_items
      ADD CONSTRAINT budget_items_budget_product_unique UNIQUE (budget_id, product_id);
  EXCEPTION
    WHEN duplicate_table THEN
      -- Constraint already exists, ignore
      NULL;
    WHEN duplicate_object THEN
      -- Unique index/constraint already exists, ignore
      NULL;
  END;
END $$;