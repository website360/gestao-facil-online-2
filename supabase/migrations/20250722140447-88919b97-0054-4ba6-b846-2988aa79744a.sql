-- Adicionar valores que faltam ao enum budget_status  
ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'aprovado';
ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'negado';