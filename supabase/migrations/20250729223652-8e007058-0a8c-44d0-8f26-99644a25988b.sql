-- Verificar se o tipo budget_status inclui o valor 'enviado'
-- Se não incluir, adicioná-lo

-- Primeiro, verificar o tipo atual
-- Adicionar o valor 'enviado' ao enum budget_status se não existir
DO $$
BEGIN
  -- Verificar se o valor 'enviado' já existe no enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'budget_status'::regtype 
    AND enumlabel = 'enviado'
  ) THEN
    ALTER TYPE budget_status ADD VALUE 'enviado';
  END IF;
END $$;