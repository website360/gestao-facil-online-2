-- Adicionar as novas roles ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendedor_externo';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendedor_interno';

-- Atualizar todos os registros existentes que têm role 'vendas' para 'vendedor_externo'
UPDATE profiles SET role = 'vendedor_externo' WHERE role = 'vendas';

-- Atualizar registros na tabela clients que fazem referência a usuários vendas
UPDATE clients SET assigned_user_id = profiles.id 
FROM profiles 
WHERE clients.assigned_user_id = profiles.id 
AND profiles.role = 'vendedor_externo';