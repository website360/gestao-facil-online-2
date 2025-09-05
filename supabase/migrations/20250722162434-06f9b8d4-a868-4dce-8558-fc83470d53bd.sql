-- Adicionar campos de peso na tabela products
DO $$ 
BEGIN
    -- Adicionar campo weight se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'weight' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN weight numeric;
        COMMENT ON COLUMN public.products.weight IS 'Peso do produto';
    END IF;

    -- Adicionar campo weight_unit se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'weight_unit' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN weight_unit text DEFAULT 'kg';
        COMMENT ON COLUMN public.products.weight_unit IS 'Unidade de peso (kg ou g)';
    END IF;
END $$;