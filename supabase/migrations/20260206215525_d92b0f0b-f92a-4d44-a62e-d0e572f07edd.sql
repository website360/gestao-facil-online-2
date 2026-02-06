-- Adicionar campo IPI (Imposto sobre Produtos Industrializados) na tabela products
ALTER TABLE public.products 
ADD COLUMN ipi numeric DEFAULT 0;

-- Comentário para documentação
COMMENT ON COLUMN public.products.ipi IS 'IPI - Imposto sobre Produtos Industrializados em percentual';