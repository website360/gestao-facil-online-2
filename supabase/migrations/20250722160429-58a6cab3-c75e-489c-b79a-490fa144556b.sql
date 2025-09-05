-- Adicionar campo cep_destino na tabela budgets se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budgets' 
                   AND column_name = 'cep_destino' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.budgets ADD COLUMN cep_destino text;
        COMMENT ON COLUMN public.budgets.cep_destino IS 'CEP de destino para cálculo de frete';
    END IF;
END $$;