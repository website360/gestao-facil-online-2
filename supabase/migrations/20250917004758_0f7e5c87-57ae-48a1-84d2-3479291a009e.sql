-- Remove as políticas muito permissivas atuais
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.budgets;
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;

-- Política para orçamentos - vendedores só veem os que criaram ou são responsáveis
CREATE POLICY "Vendors can view their own budgets" 
ON public.budgets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['vendas'::user_role, 'vendedor_externo'::user_role, 'vendedor_interno'::user_role])
    AND (budgets.created_by = auth.uid() OR 
         EXISTS (SELECT 1 FROM clients c WHERE c.id = budgets.client_id AND c.assigned_user_id = auth.uid()))
  )
);

-- Política para orçamentos - admins e gerentes veem todos
CREATE POLICY "Admins and managers can view all budgets" 
ON public.budgets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['admin'::user_role, 'gerente'::user_role, 'separacao'::user_role, 'conferencia'::user_role, 'nota_fiscal'::user_role, 'entregador'::user_role])
  )
);

-- Política para vendas - vendedores só veem as que criaram ou são responsáveis
CREATE POLICY "Vendors can view their own sales" 
ON public.sales 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['vendas'::user_role, 'vendedor_externo'::user_role, 'vendedor_interno'::user_role])
    AND (sales.created_by = auth.uid() OR 
         sales.responsible_user_id = auth.uid() OR
         EXISTS (SELECT 1 FROM clients c WHERE c.id = sales.client_id AND c.assigned_user_id = auth.uid()))
  )
);

-- Política para vendas - admins e gerentes veem todas
CREATE POLICY "Admins and managers can view all sales" 
ON public.sales 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['admin'::user_role, 'gerente'::user_role, 'separacao'::user_role, 'conferencia'::user_role, 'nota_fiscal'::user_role, 'entregador'::user_role])
  )
);