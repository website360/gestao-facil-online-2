-- Adicionar constraints únicos para CPF e CNPJ na tabela clients
-- Primeiro, remover duplicatas se existirem
DELETE FROM public.clients a USING public.clients b 
WHERE a.id < b.id 
AND ((a.cpf IS NOT NULL AND a.cpf = b.cpf) 
     OR (a.cnpj IS NOT NULL AND a.cnpj = b.cnpj));

-- Criar índices únicos parciais para CPF e CNPJ (apenas quando não são nulos)
CREATE UNIQUE INDEX CONCURRENTLY idx_clients_cpf_unique 
ON public.clients (cpf) 
WHERE cpf IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_clients_cnpj_unique 
ON public.clients (cnpj) 
WHERE cnpj IS NOT NULL;