-- Criar políticas específicas para clientes acessarem dados necessários para orçamentos
-- Permitir que clientes vejam métodos de pagamento
CREATE POLICY "Clients can view payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'cliente'
  ) 
  AND active = true
);

-- Permitir que clientes vejam tipos de pagamento
CREATE POLICY "Clients can view payment types" 
ON public.payment_types 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'cliente'
  ) 
  AND active = true
);

-- Permitir que clientes vejam opções de frete
CREATE POLICY "Clients can view shipping options" 
ON public.shipping_options 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'cliente'
  ) 
  AND active = true
);