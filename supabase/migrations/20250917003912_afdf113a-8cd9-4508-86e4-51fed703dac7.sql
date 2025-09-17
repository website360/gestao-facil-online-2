-- Adicionar política para permitir que vendedores insiram clientes
CREATE POLICY "Vendors can insert clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['vendas'::user_role, 'vendedor_externo'::user_role, 'vendedor_interno'::user_role])))
  )
);