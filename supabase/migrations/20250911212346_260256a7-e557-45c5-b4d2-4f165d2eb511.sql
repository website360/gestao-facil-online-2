-- Criar bucket para comprovantes de pagamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false);

-- Criar tabela para armazenar informações dos anexos
CREATE TABLE public.sale_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sale_attachments ENABLE ROW LEVEL SECURITY;

-- Política para inserção (usuários autenticados)
CREATE POLICY "Authenticated users can insert sale attachments"
ON public.sale_attachments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para visualização (usuários autenticados)
CREATE POLICY "Authenticated users can view sale attachments"
ON public.sale_attachments
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para exclusão (usuários autenticados)
CREATE POLICY "Authenticated users can delete sale attachments"
ON public.sale_attachments
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Políticas de storage para comprovantes
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-receipts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view payment receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete payment receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid() IS NOT NULL
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sale_attachments_updated_at
  BEFORE UPDATE ON public.sale_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();