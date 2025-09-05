-- Verificar e corrigir o constraint foreign key da tabela budgets
-- O problema é que created_by está tentando referenciar auth.users mas deveria permitir IDs de clientes também

-- Primeiro vamos remover o constraint que está causando problema
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_created_by_fkey;

-- Agora o campo created_by pode aceitar tanto user IDs quanto client IDs
-- Não vamos criar um novo constraint porque created_by pode ser:
-- 1. Um user ID (para funcionários)
-- 2. Um client ID (para clientes que criam seus próprios orçamentos)

-- Adicionar comentário para documentar o comportamento
COMMENT ON COLUMN public.budgets.created_by IS 'ID do criador do orçamento - pode ser user ID (funcionários) ou client ID (clientes)';