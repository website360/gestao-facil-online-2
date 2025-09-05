-- Verificar se as políticas RLS para clientes estão funcionando corretamente
-- Vamos ajustar as políticas para garantir que funcionem tanto para clientes logados via auth quanto via sistema customizado

-- Primeiro, vamos criar uma função para verificar se o usuário é cliente
CREATE OR REPLACE FUNCTION public.is_client_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'cliente'
  );
$$;

-- Atualizar as políticas para usar a função
DROP POLICY IF EXISTS "Clients can view payment methods" ON public.payment_methods;
CREATE POLICY "Clients can view payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (public.is_client_user() AND active = true);

DROP POLICY IF EXISTS "Clients can view payment types" ON public.payment_types;
CREATE POLICY "Clients can view payment types" 
ON public.payment_types 
FOR SELECT 
USING (public.is_client_user() AND active = true);

DROP POLICY IF EXISTS "Clients can view shipping options" ON public.shipping_options;
CREATE POLICY "Clients can view shipping options" 
ON public.shipping_options 
FOR SELECT 
USING (public.is_client_user() AND active = true);

-- Criar política para clientes visualizarem produtos ativos
CREATE POLICY "Clients can view products" 
ON public.products 
FOR SELECT 
USING (public.is_client_user());

-- Criar política para clientes visualizarem suas próprias informações de cliente
CREATE POLICY "Clients can view their own client data" 
ON public.clients 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND email = (
  SELECT email FROM auth.users WHERE id = auth.uid()
));