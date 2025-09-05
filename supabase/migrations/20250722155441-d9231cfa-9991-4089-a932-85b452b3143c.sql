-- Alterar o tipo da coluna value para text na tabela system_configurations
ALTER TABLE public.system_configurations ALTER COLUMN value TYPE text USING value::text;

-- Atualizar os valores existentes para garantir que sejam strings simples
UPDATE public.system_configurations 
SET value = CASE 
  WHEN value::text ~ '^[0-9]+(\.[0-9]+)?$' THEN value::text
  ELSE value::text
END;