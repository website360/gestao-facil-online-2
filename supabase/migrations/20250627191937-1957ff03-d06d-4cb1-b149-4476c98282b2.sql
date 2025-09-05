
-- Adicionar coluna invoice_percentage na tabela budgets
ALTER TABLE public.budgets 
ADD COLUMN invoice_percentage numeric DEFAULT 0;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.budgets.invoice_percentage IS 'Percentual de nota fiscal em %';
