-- Adicionar campo para indicar se meio de pagamento requer comprovantes
ALTER TABLE public.payment_methods 
ADD COLUMN requires_receipt BOOLEAN NOT NULL DEFAULT false;

-- Adicionar campo para indicar se tipo de pagamento requer comprovantes  
ALTER TABLE public.payment_types 
ADD COLUMN requires_receipt BOOLEAN NOT NULL DEFAULT false;

-- Comentários para documentar os campos
COMMENT ON COLUMN public.payment_methods.requires_receipt IS 'Indica se este meio de pagamento requer anexo de comprovantes';
COMMENT ON COLUMN public.payment_types.requires_receipt IS 'Indica se este tipo de pagamento requer anexo de comprovantes';