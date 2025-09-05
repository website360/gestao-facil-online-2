
-- Adicionar colunas para rastrear os responsáveis por cada etapa
ALTER TABLE sales 
ADD COLUMN separation_user_id UUID REFERENCES auth.users(id),
ADD COLUMN separation_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN conference_user_id UUID REFERENCES auth.users(id),
ADD COLUMN conference_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN invoice_user_id UUID REFERENCES auth.users(id),
ADD COLUMN invoice_completed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN sales.separation_user_id IS 'Usuário que completou a separação';
COMMENT ON COLUMN sales.separation_completed_at IS 'Data/hora da conclusão da separação';
COMMENT ON COLUMN sales.conference_user_id IS 'Usuário que completou a conferência';
COMMENT ON COLUMN sales.conference_completed_at IS 'Data/hora da conclusão da conferência';
COMMENT ON COLUMN sales.invoice_user_id IS 'Usuário que completou a nota fiscal';
COMMENT ON COLUMN sales.invoice_completed_at IS 'Data/hora da conclusão da nota fiscal';
