-- Criar tabela para volumes da venda
CREATE TABLE public.sale_volumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL,
  weight_kg NUMERIC(8,3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Garantir que cada volume seja único por venda
  UNIQUE(sale_id, volume_number)
);

-- Habilitar RLS
ALTER TABLE public.sale_volumes ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados poderem ver volumes
CREATE POLICY "Authenticated users can view sale volumes" 
ON public.sale_volumes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Política para usuários autenticados poderem inserir volumes
CREATE POLICY "Authenticated users can insert sale volumes" 
ON public.sale_volumes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para usuários autenticados poderem atualizar volumes
CREATE POLICY "Authenticated users can update sale volumes" 
ON public.sale_volumes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Política para usuários autenticados poderem deletar volumes
CREATE POLICY "Authenticated users can delete sale volumes" 
ON public.sale_volumes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_sale_volumes_updated_at
BEFORE UPDATE ON public.sale_volumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo total_volumes na tabela sales
ALTER TABLE public.sales ADD COLUMN total_volumes INTEGER;
ALTER TABLE public.sales ADD COLUMN total_weight_kg NUMERIC(8,3);