-- Alterar o status padrão dos orçamentos para 'aguardando_aprovacao'
-- para que tanto vendedores quanto clientes tenham o mesmo comportamento

ALTER TABLE public.budgets 
ALTER COLUMN status SET DEFAULT 'aguardando_aprovacao'::budget_status;

-- Atualizar orçamentos existentes com status 'aguardando' para 'aguardando_aprovacao'
UPDATE public.budgets 
SET status = 'aguardando_aprovacao'::budget_status 
WHERE status = 'aguardando'::budget_status;