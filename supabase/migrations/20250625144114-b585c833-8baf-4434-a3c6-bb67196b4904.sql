
-- Add missing payment-related columns to budgets table
ALTER TABLE public.budgets 
ADD COLUMN installments integer DEFAULT 1,
ADD COLUMN check_installments integer DEFAULT 1,
ADD COLUMN check_due_dates integer[] DEFAULT ARRAY[]::integer[],
ADD COLUMN boleto_installments integer DEFAULT 1,
ADD COLUMN boleto_due_dates integer[] DEFAULT ARRAY[]::integer[],
ADD COLUMN discount_percentage numeric DEFAULT 0;
