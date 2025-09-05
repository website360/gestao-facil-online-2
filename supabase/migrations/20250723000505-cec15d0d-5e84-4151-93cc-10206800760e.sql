-- Permitir que gerentes e vendedores vejam as configurações dos Correios
CREATE POLICY "Gerentes and vendas can view system configurations" ON public.system_configurations FOR SELECT USING (
  (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('gerente', 'vendas')))
);