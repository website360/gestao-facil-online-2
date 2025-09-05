-- Atualizar política para permitir que clientes com acesso ao sistema vejam configurações dos Correios
DROP POLICY IF EXISTS "Gerentes and vendas can view system configurations" ON public.system_configurations;

CREATE POLICY "Users and clients can view system configurations" ON public.system_configurations FOR SELECT USING (
  -- Usuários autenticados normalmente (gerentes, vendas, admin)
  (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('gerente', 'vendas', 'admin')))
  OR
  -- Clientes com acesso ao sistema habilitado (para login customizado)
  (EXISTS ( SELECT 1 FROM clients WHERE allow_system_access = true))
);