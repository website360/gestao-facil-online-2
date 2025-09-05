
-- Primeiro, vamos alterar todas as linhas existentes que tenham status antigos para os novos valores
-- Convertendo diretamente no enum existente
UPDATE public.budgets 
SET status = 'enviado'::budget_status 
WHERE status::text IN ('rascunho', 'aprovado', 'rejeitado', 'convertido');

-- Agora vamos recriar o enum com apenas os valores que precisamos
ALTER TYPE public.budget_status RENAME TO budget_status_old;

CREATE TYPE public.budget_status AS ENUM ('aguardando', 'enviado');

-- Atualizar a coluna para usar o novo enum
ALTER TABLE public.budgets 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE budget_status USING 
    CASE 
      WHEN status::text = 'enviado' THEN 'enviado'::budget_status
      ELSE 'aguardando'::budget_status
    END,
  ALTER COLUMN status SET DEFAULT 'aguardando'::budget_status;

-- Remover o tipo antigo
DROP TYPE budget_status_old;
