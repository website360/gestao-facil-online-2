-- Criar índices únicos parciais para CPF e CNPJ na tabela clients
-- Apenas quando não são nulos e evitar duplicatas futuras
CREATE UNIQUE INDEX CONCURRENTLY idx_clients_cpf_unique 
ON public.clients (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

CREATE UNIQUE INDEX CONCURRENTLY idx_clients_cnpj_unique 
ON public.clients (cnpj) 
WHERE cnpj IS NOT NULL AND cnpj != '';