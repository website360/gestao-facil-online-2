-- Criar tabela para histórico de movimentações de estoque
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
  quantity NUMERIC NOT NULL,
  previous_stock NUMERIC NOT NULL,
  new_stock NUMERIC NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('venda', 'entrada_estoque', 'ajuste_manual', 'entrada_massa')),
  reference_id UUID, -- ID da venda ou outro documento de referência
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX idx_stock_movements_movement_type ON public.stock_movements(movement_type);
CREATE INDEX idx_stock_movements_reason ON public.stock_movements(reason);

-- Habilitar RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can view stock movements" 
ON public.stock_movements 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert stock movements" 
ON public.stock_movements 
FOR INSERT 
WITH CHECK (true);

-- Função para registrar movimentação de estoque
CREATE OR REPLACE FUNCTION public.register_stock_movement(
  p_product_id UUID,
  p_user_id UUID,
  p_movement_type TEXT,
  p_quantity NUMERIC,
  p_previous_stock NUMERIC,
  p_new_stock NUMERIC,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  movement_id UUID;
BEGIN
  INSERT INTO public.stock_movements (
    product_id,
    user_id,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reason,
    reference_id,
    notes
  ) VALUES (
    p_product_id,
    p_user_id,
    p_movement_type,
    p_quantity,
    p_previous_stock,
    p_new_stock,
    p_reason,
    p_reference_id,
    p_notes
  ) RETURNING id INTO movement_id;
  
  RETURN movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE public.stock_movements IS 'Histórico de todas as movimentações de estoque';
COMMENT ON COLUMN public.stock_movements.movement_type IS 'Tipo de movimentação: entrada, saida, ajuste';
COMMENT ON COLUMN public.stock_movements.reason IS 'Motivo da movimentação: venda, entrada_estoque, ajuste_manual, entrada_massa';
COMMENT ON COLUMN public.stock_movements.reference_id IS 'ID de referência (ex: ID da venda)';