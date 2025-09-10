-- Adicionar novo status 'processando' ao enum budget_status
ALTER TYPE budget_status ADD VALUE 'processando';

-- Alterar o default do campo status para 'processando'
ALTER TABLE budgets ALTER COLUMN status SET DEFAULT 'processando';