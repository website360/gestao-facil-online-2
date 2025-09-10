-- Atualizar política RLS para permitir que usuários de separação vejam os dados dos clientes
DROP POLICY IF EXISTS "Users can view clients based on role and assignment" ON public.clients;

CREATE POLICY "Users can view clients based on role and assignment" ON public.clients
FOR SELECT 
USING (
  (EXISTS ( 
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['admin'::user_role, 'gerente'::user_role, 'separacao'::user_role])
  )) 
  OR 
  ((EXISTS ( 
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'vendas'::user_role
  )) AND (assigned_user_id = auth.uid()))
);