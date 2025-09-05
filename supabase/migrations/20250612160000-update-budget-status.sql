
-- Alterar o enum budget_status para incluir 'aguardando' e remover 'rascunho', 'aprovado', 'rejeitado', 'convertido'
ALTER TYPE public.budget_status RENAME TO budget_status_old;

CREATE TYPE public.budget_status AS ENUM ('aguardando', 'enviado');

-- Atualizar a tabela budgets para usar o novo enum
ALTER TABLE public.budgets 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE budget_status USING 
    CASE 
      WHEN status::text = 'rascunho' THEN 'aguardando'::budget_status
      WHEN status::text = 'enviado' THEN 'enviado'::budget_status
      ELSE 'aguardando'::budget_status
    END,
  ALTER COLUMN status SET DEFAULT 'aguardando'::budget_status;

-- Remover o tipo antigo
DROP TYPE budget_status_old;
