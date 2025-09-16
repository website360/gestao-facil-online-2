-- Atualizar todos os registros existentes que têm role 'vendas' para 'vendedor_externo'
UPDATE profiles SET role = 'vendedor_externo' WHERE role = 'vendas';