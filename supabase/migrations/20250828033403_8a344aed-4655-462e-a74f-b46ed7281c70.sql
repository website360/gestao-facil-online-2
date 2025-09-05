-- Adicionar política para permitir que clientes atualizem seus próprios orçamentos
CREATE POLICY "Clients can update their own budgets"
ON public.budgets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = budgets.client_id 
    AND c.allow_system_access = true
  )
  AND (client_id = created_by) -- Só orçamentos criados pelo próprio cliente
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = budgets.client_id 
    AND c.allow_system_access = true
  )
  AND (client_id = created_by) -- Só orçamentos criados pelo próprio cliente
);