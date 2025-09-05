
-- Adicionar coluna para informações de entrega local na tabela budgets
ALTER TABLE budgets ADD COLUMN local_delivery_info text;

-- Adicionar coluna para informações de entrega local na tabela sales
ALTER TABLE sales ADD COLUMN local_delivery_info text;
