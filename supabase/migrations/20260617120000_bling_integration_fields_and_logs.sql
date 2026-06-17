-- Integração Bling: campos de retorno na venda + tabela de log de envios

-- 1) Campos de retorno do Bling na tabela de vendas
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS bling_order_number TEXT NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS bling_status TEXT NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS bling_last_error TEXT NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS bling_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.sales.bling_order_number IS 'Número do pedido de venda retornado pelo Bling';
COMMENT ON COLUMN public.sales.bling_status IS 'Situação do pedido no Bling (último status conhecido)';
COMMENT ON COLUMN public.sales.bling_last_error IS 'Mensagem do último erro ao enviar para o Bling';
COMMENT ON COLUMN public.sales.bling_sent_at IS 'Data/hora do último envio bem-sucedido ao Bling';

-- 2) Tabela de log de envios ao Bling
CREATE TABLE IF NOT EXISTS public.bling_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NULL REFERENCES public.sales(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  dry_run BOOLEAN NOT NULL DEFAULT false,
  bling_order_id TEXT NULL,
  bling_order_number TEXT NULL,
  error_message TEXT NULL,
  request_payload JSONB NULL,
  response_payload JSONB NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_sale_id ON public.bling_sync_logs(sale_id);
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_created_at ON public.bling_sync_logs(created_at DESC);

-- 3) RLS: apenas administradores podem ler os logs (a edge function escreve via service role, ignorando RLS)
ALTER TABLE public.bling_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bling_sync_logs'
      AND policyname = 'Admins can view bling sync logs'
  ) THEN
    CREATE POLICY "Admins can view bling sync logs"
    ON public.bling_sync_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;
