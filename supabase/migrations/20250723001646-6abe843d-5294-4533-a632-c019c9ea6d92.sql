-- Adicionar campo de código de rastreio na tabela de vendas
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tracking_code text;