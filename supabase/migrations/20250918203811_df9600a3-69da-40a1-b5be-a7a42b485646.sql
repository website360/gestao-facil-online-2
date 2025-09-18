-- Adicionar coluna taxes_amount (impostos) nas tabelas budgets e sales
ALTER TABLE public.budgets ADD COLUMN taxes_amount numeric DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN taxes_amount numeric DEFAULT 0;