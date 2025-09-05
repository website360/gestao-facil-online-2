
-- Criar bucket para logos no Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true);

-- Criar política para permitir upload de logos (permissiva para facilitar uso)
CREATE POLICY "Allow logo uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logos');

-- Criar política para permitir leitura de logos
CREATE POLICY "Allow logo reads" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Criar política para permitir atualização de logos
CREATE POLICY "Allow logo updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'logos');

-- Criar política para permitir exclusão de logos
CREATE POLICY "Allow logo deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'logos');

-- Inserir configuração padrão de PDF se não existir
INSERT INTO public.system_configurations (key, value, description) 
VALUES (
  'pdf_budget_config', 
  '{"header":{"height":25,"backgroundColor":"#0EA5E9","companyName":"Sistema de Gestão","showLogo":true},"footer":{"height":20,"validityText":"Este orçamento tem validade de 30 dias a partir da data de emissão.","copyrightText":"Sistema de Gestão - 2025"},"fonts":{"title":17,"subtitle":13,"normal":10,"small":9},"colors":{"primary":"#0EA5E9","dark":"#1F2937","gray":"#6B7280"}}',
  'Configurações do PDF de orçamento'
)
ON CONFLICT (key) DO NOTHING;
