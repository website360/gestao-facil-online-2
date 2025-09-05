
-- Adicionar novos campos à tabela clients
ALTER TABLE public.clients ADD COLUMN client_type text CHECK (client_type IN ('fisica', 'juridica'));
ALTER TABLE public.clients ADD COLUMN cpf text;
ALTER TABLE public.clients ADD COLUMN cnpj text;
ALTER TABLE public.clients ADD COLUMN razao_social text;
ALTER TABLE public.clients ADD COLUMN cep text;
ALTER TABLE public.clients ADD COLUMN street text;
ALTER TABLE public.clients ADD COLUMN number text;
ALTER TABLE public.clients ADD COLUMN complement text;
ALTER TABLE public.clients ADD COLUMN neighborhood text;
ALTER TABLE public.clients ADD COLUMN city text;
ALTER TABLE public.clients ADD COLUMN state text;

-- Atualizar clientes existentes para ter um tipo padrão
UPDATE public.clients SET client_type = 'fisica' WHERE client_type IS NULL;

-- Tornar o campo client_type obrigatório
ALTER TABLE public.clients ALTER COLUMN client_type SET NOT NULL;
