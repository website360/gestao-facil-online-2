-- Adicionar as novas roles ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendedor_externo';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendedor_interno';