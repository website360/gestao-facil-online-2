
-- Criar tabela de fornecedores
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cnpj TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  contact_person TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campo supplier_id na tabela products
ALTER TABLE public.products 
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);

-- Criar índice para melhor performance
CREATE INDEX idx_products_supplier ON public.products(supplier_id);

-- Trigger para atualizar updated_at na tabela suppliers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
