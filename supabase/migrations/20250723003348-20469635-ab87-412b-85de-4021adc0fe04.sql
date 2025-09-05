-- Criar política para permitir que clientes vejam os itens de seus próprios orçamentos
CREATE POLICY "Clients can view their own budget items" 
ON budget_items
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM budgets b
    JOIN clients c ON c.id = b.client_id
    WHERE b.id = budget_items.budget_id 
    AND c.allow_system_access = true
    AND (
      auth.uid() IS NOT NULL 
      OR b.client_id = b.created_by
    )
  )
);