-- Atualizar política RLS para incluir as novas roles de vendedor
DROP POLICY IF EXISTS "Users can view clients based on role and assignment" ON public.clients;

CREATE POLICY "Users can view clients based on role and assignment" 
ON public.clients 
FOR SELECT 
USING (
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'gerente'::user_role, 'separacao'::user_role, 'conferencia'::user_role, 'nota_fiscal'::user_role, 'entregador'::user_role])))
  )) OR 
  ((EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['vendas'::user_role, 'vendedor_externo'::user_role, 'vendedor_interno'::user_role])))
  )) AND (assigned_user_id = auth.uid()))
);