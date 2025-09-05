
-- Criar tabela para armazenar configurações do sistema
CREATE TABLE public.system_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para segurança
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver e modificar configurações
CREATE POLICY "Admins can manage system configurations" 
  ON public.system_configurations 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON public.system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO public.system_configurations (key, value, description) VALUES
  ('smtp_config', '{"host":"","port":587,"username":"","password":"","from_email":"","from_name":"","enabled":false}', 'Configurações do servidor SMTP para envio de emails'),
  ('whatsapp_config', '{"api_url":"","api_token":"","enabled":false}', 'Configurações da API do WhatsApp para envio de mensagens');
