-- Adicionar campo invoice_number na tabela sales
ALTER TABLE public.sales 
ADD COLUMN invoice_number text;

-- Criar índice para melhorar performance de busca por número da nota
CREATE INDEX idx_sales_invoice_number ON public.sales(invoice_number);