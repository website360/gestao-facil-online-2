-- Criar política específica para permitir que clientes insiram orçamentos
-- Os clientes não usam auth.uid() então precisam de política especial

-- Política para permitir inserção de orçamentos por clientes
CREATE POLICY "Clients can create their own budgets" 
ON public.budgets 
FOR INSERT 
WITH CHECK (
  -- Permitir para usuários autenticados normalmente
  auth.uid() IS NOT NULL
  OR
  -- Permitir para clientes que criam orçamento para si mesmos
  (client_id = created_by AND EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id 
    AND c.allow_system_access = true
  ))
);

-- Política para permitir inserção de itens de orçamento por clientes
CREATE POLICY "Clients can create budget items" 
ON public.budget_items 
FOR INSERT 
WITH CHECK (
  -- Permitir para usuários autenticados normalmente
  auth.uid() IS NOT NULL
  OR
  -- Permitir para clientes que estão criando itens para seus orçamentos
  EXISTS (
    SELECT 1 FROM public.budgets b
    JOIN public.clients c ON c.id = b.client_id
    WHERE b.id = budget_id 
    AND b.client_id = b.created_by
    AND c.allow_system_access = true
  )
);