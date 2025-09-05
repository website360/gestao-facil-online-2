-- Habilitar RLS na tabela suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela suppliers
CREATE POLICY "Authenticated users can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage suppliers" 
ON public.suppliers 
FOR ALL 
USING (true);