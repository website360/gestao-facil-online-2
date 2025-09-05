-- Remover configuração duplicada e manter apenas um valor para desconto
-- Atualizar a descrição da configuração principal
UPDATE public.system_configurations 
SET description = 'Limite máximo de desconto (geral e individual) que vendedores podem aplicar (%)'
WHERE key = 'max_discount_sales';

-- Remover a configuração individual separada se existir
DELETE FROM public.system_configurations 
WHERE key = 'max_discount_individual_sales';

-- Comentar sobre a simplificação
COMMENT ON COLUMN public.system_configurations.key IS 'Chave única da configuração do sistema';
COMMENT ON COLUMN public.system_configurations.value IS 'Valor da configuração (sempre armazenado como texto)';
COMMENT ON COLUMN public.system_configurations.description IS 'Descrição explicativa da configuração';