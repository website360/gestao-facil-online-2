-- Criar tabela para rastrear itens separados
CREATE TABLE public.separation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  sale_item_id uuid NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  separated_quantity integer NOT NULL DEFAULT 0,
  total_quantity integer NOT NULL,
  separated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sale_id, sale_item_id)
);

-- Habilitar RLS
ALTER TABLE public.separation_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para separation_items
CREATE POLICY "Authenticated users can view separation items"
ON public.separation_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert separation items"
ON public.separation_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update separation items"
ON public.separation_items
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete separation items"
ON public.separation_items
FOR DELETE
TO authenticated
USING (true);

-- Adicionar campos para rastrear progresso da separação na tabela sales
ALTER TABLE public.sales 
ADD COLUMN separation_percentage numeric DEFAULT 0,
ADD COLUMN separation_complete boolean DEFAULT false;