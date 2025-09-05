-- Criar política para permitir que clientes vejam suas próprias vendas
CREATE POLICY "Clients can view their own sales" 
ON sales
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM clients c
    WHERE c.id = sales.client_id 
    AND c.allow_system_access = true
    AND (
      auth.uid() IS NOT NULL 
      OR c.id = sales.client_id
    )
  )
);

-- Criar política para permitir que clientes vejam os itens de suas próprias vendas
CREATE POLICY "Clients can view their own sale items" 
ON sale_items
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM sales s
    JOIN clients c ON c.id = s.client_id
    WHERE s.id = sale_items.sale_id 
    AND c.allow_system_access = true
    AND (
      auth.uid() IS NOT NULL 
      OR c.id = s.client_id
    )
  )
);