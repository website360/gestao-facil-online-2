-- Adicionar campo para armazenar a data de conversão de orçamento em venda
-- Isso permitirá distinguir entre a data de criação original e quando foi convertido

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS converted_from_budget_at timestamp with time zone;

-- Comentar o novo campo
COMMENT ON COLUMN public.sales.converted_from_budget_at IS 'Data e hora quando este orçamento foi convertido em venda. NULL se a venda foi criada diretamente.';

-- Para vendas existentes que vieram de orçamentos, vamos definir essa data
-- baseada na data de criação da venda (aproximação)
UPDATE public.sales 
SET converted_from_budget_at = created_at 
WHERE budget_id IS NOT NULL AND converted_from_budget_at IS NULL;