-- Corrigir as políticas RLS para permitir que clientes vejam os dados necessários
-- sem autenticação tradicional (já que usam login customizado)

-- Atualizar política de métodos de pagamento
DROP POLICY IF EXISTS "Clients can view payment methods" ON public.payment_methods;
CREATE POLICY "Clients can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (
  -- Usuários autenticados normalmente
  auth.uid() IS NOT NULL 
  OR 
  -- Permitir acesso para todos se o método está ativo (será controlado pela aplicação)
  active = true
);

-- Atualizar política de tipos de pagamento
DROP POLICY IF EXISTS "Clients can view payment types" ON public.payment_types;
CREATE POLICY "Clients can view active payment types" 
ON public.payment_types 
FOR SELECT 
USING (
  -- Usuários autenticados normalmente
  auth.uid() IS NOT NULL 
  OR 
  -- Permitir acesso para todos se o tipo está ativo
  active = true
);

-- Atualizar política de opções de frete
DROP POLICY IF EXISTS "Clients can view shipping options" ON public.shipping_options;
CREATE POLICY "Clients can view active shipping options" 
ON public.shipping_options 
FOR SELECT 
USING (
  -- Usuários autenticados normalmente
  auth.uid() IS NOT NULL 
  OR 
  -- Permitir acesso para todos se a opção está ativa
  active = true
);

-- Atualizar política de produtos
DROP POLICY IF EXISTS "Clients can view products" ON public.products;
CREATE POLICY "Clients can view all products" 
ON public.products 
FOR SELECT 
USING (
  -- Usuários autenticados normalmente
  auth.uid() IS NOT NULL 
  OR 
  -- Permitir acesso para todos os produtos (será controlado pela aplicação)
  true
);