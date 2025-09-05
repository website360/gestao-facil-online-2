-- Adicionar campo height (altura) à tabela products
ALTER TABLE public.products 
ADD COLUMN height numeric;

-- Comentário: Campo altura em centímetros para cálculo preciso do frete dos Correios