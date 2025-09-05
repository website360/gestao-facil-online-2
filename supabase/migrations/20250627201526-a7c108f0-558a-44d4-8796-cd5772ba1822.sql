
-- Add missing payment and shipping columns to sales table
ALTER TABLE public.sales 
ADD COLUMN payment_method_id uuid,
ADD COLUMN payment_type_id uuid,
ADD COLUMN shipping_option_id uuid,
ADD COLUMN shipping_cost numeric DEFAULT 0,
ADD COLUMN installments integer DEFAULT 1,
ADD COLUMN check_installments integer DEFAULT 1,
ADD COLUMN check_due_dates integer[] DEFAULT ARRAY[]::integer[],
ADD COLUMN boleto_installments integer DEFAULT 1,
ADD COLUMN boleto_due_dates integer[] DEFAULT ARRAY[]::integer[];
