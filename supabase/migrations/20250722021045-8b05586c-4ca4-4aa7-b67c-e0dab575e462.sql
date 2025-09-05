-- Adicionar a role 'gerente' ao enum user_role
ALTER TYPE user_role ADD VALUE 'gerente' BEFORE 'vendas';

-- Atualizar comentário para documentar as roles
COMMENT ON TYPE user_role IS 'Roles do sistema: admin, gerente, vendas, separacao, conferencia, nota_fiscal';