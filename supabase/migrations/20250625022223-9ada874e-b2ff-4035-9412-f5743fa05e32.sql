
-- Criar tabela para meios de pagamento
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para tipos de pagamento
CREATE TABLE public.payment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para opções de frete
CREATE TABLE public.shipping_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos na tabela budgets
ALTER TABLE public.budgets 
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id),
ADD COLUMN payment_type_id UUID REFERENCES public.payment_types(id),
ADD COLUMN shipping_option_id UUID REFERENCES public.shipping_options(id),
ADD COLUMN shipping_cost NUMERIC DEFAULT 0;

-- Criar índices para melhor performance
CREATE INDEX idx_budgets_payment_method ON public.budgets(payment_method_id);
CREATE INDEX idx_budgets_payment_type ON public.budgets(payment_type_id);
CREATE INDEX idx_budgets_shipping_option ON public.budgets(shipping_option_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_types_updated_at
  BEFORE UPDATE ON public.payment_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_options_updated_at
  BEFORE UPDATE ON public.shipping_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_options ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir acesso aos usuários autenticados
CREATE POLICY "Authenticated users can view payment methods" ON public.payment_methods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage payment methods" ON public.payment_methods
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view payment types" ON public.payment_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage payment types" ON public.payment_types
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view shipping options" ON public.shipping_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage shipping options" ON public.shipping_options
  FOR ALL TO authenticated USING (true);

-- Inserir dados iniciais
INSERT INTO public.payment_methods (name, description) VALUES
  ('Dinheiro', 'Pagamento em dinheiro'),
  ('Cartão de Crédito', 'Pagamento via cartão de crédito'),
  ('Cartão de Débito', 'Pagamento via cartão de débito'),
  ('PIX', 'Pagamento via PIX'),
  ('Transferência Bancária', 'Transferência bancária');

INSERT INTO public.payment_types (name, description) VALUES
  ('À Vista', 'Pagamento à vista'),
  ('Parcelado', 'Pagamento parcelado'),
  ('30 dias', 'Pagamento em 30 dias'),
  ('60 dias', 'Pagamento em 60 dias');

INSERT INTO public.shipping_options (name, description, price) VALUES
  ('Retirada no Local', 'Cliente retira no estabelecimento', 0),
  ('Entrega Local', 'Entrega na região', 10.00),
  ('Correios - PAC', 'Envio via Correios PAC', 15.00),
  ('Correios - SEDEX', 'Envio via Correios SEDEX', 25.00);
