-- Adicionar campo para sinalizar vendas prontas para gerar etiqueta dos Correios
ALTER TABLE public.sales 
ADD COLUMN ready_for_shipping_label BOOLEAN DEFAULT FALSE;