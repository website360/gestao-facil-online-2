-- Atualizar política RLS para incluir vendedor_interno e vendedor_externo
DROP POLICY IF EXISTS "Users and clients can view system configurations" ON public.system_configurations;

CREATE POLICY "Users and clients can view system configurations" 
ON public.system_configurations 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['gerente'::user_role, 'vendas'::user_role, 'admin'::user_role, 'vendedor_interno'::user_role, 'vendedor_externo'::user_role])
  )) 
  OR 
  (EXISTS (
    SELECT 1
    FROM public.clients
    WHERE clients.allow_system_access = true
  ))
);