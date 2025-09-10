-- Atualizar a política RLS para clientes para que vendedores só vejam clientes atribuídos a eles
-- Clientes sem vendedor responsável (assigned_user_id null) ficam visíveis apenas para admin e gerente

DROP POLICY IF EXISTS "Users can view clients based on role and assignment" ON public.clients;

CREATE POLICY "Users can view clients based on role and assignment"
ON public.clients
FOR SELECT
TO authenticated
USING (
  -- Admin e gerente podem ver todos os clientes
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'gerente'::user_role])
  )) 
  OR 
  -- Vendas podem ver apenas clientes atribuídos especificamente a eles
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'vendas'::user_role
  ) AND assigned_user_id = auth.uid())
  OR
  -- Clientes com acesso ao sistema podem ver seus próprios dados
  (allow_system_access = true)
);