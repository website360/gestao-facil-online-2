-- Inserir configurações padrão para limites de desconto de vendedores
INSERT INTO public.system_configurations (key, value, description) 
VALUES 
  ('max_discount_sales', '10', 'Limite máximo de desconto geral que vendedores podem aplicar (%)'),
  ('max_discount_individual_sales', '5', 'Limite máximo de desconto individual por item que vendedores podem aplicar (%)')
ON CONFLICT (key) DO NOTHING;

-- Comentar sobre as configurações
COMMENT ON TABLE public.system_configurations IS 'Configurações gerais do sistema para controle de funcionalidades e limites';