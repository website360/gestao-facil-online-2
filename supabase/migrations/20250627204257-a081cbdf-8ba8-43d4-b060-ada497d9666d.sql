
-- Add missing discount_percentage and invoice_percentage columns to sales table
ALTER TABLE public.sales 
ADD COLUMN discount_percentage numeric DEFAULT 0,
ADD COLUMN invoice_percentage numeric DEFAULT 0;

-- Add comments to document the fields
COMMENT ON COLUMN public.sales.discount_percentage IS 'Percentual de desconto geral em %';
COMMENT ON COLUMN public.sales.invoice_percentage IS 'Percentual de nota fiscal em %';
