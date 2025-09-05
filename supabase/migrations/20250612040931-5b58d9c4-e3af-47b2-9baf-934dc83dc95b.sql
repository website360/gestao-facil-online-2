
-- Criar tabela para armazenar os dados da conferência
CREATE TABLE public.conference_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  conferred_quantity INTEGER NOT NULL CHECK (conferred_quantity > 0),
  is_correct BOOLEAN NOT NULL,
  conferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sale_id, sale_item_id)
);

-- Adicionar índices para melhor performance
CREATE INDEX idx_conference_items_sale_id ON public.conference_items(sale_id);
CREATE INDEX idx_conference_items_sale_item_id ON public.conference_items(sale_item_id);

-- Habilitar RLS
ALTER TABLE public.conference_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conference_items
CREATE POLICY "Authenticated users can view conference items" ON public.conference_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert conference items" ON public.conference_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update conference items" ON public.conference_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete conference items" ON public.conference_items
  FOR DELETE TO authenticated USING (true);
