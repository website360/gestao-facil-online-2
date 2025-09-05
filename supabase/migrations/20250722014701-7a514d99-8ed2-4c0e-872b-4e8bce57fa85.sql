-- Adicionar campos de acesso ao sistema para clientes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS allow_system_access boolean DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS system_password text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.clients.allow_system_access IS 'Permite que o cliente acesse o sistema para gerar orçamentos';
COMMENT ON COLUMN public.clients.system_password IS 'Senha para acesso do cliente ao sistema (apenas se allow_system_access = true)';